import fs from 'fs';
import https from 'https';
import path from 'path';

import { LokaliseApi } from '@lokalise/node-api';
import AdmZip from 'adm-zip';
import { config } from 'dotenv';

import getEnvFilePath from '../support/dotenv/GetEnvFilePath';

config({ path: getEnvFilePath() });

const LOKALISE_API_TOKEN = process.env.LOKALISE_API_TOKEN || '';
const LOKALISE_PROJECT_ID = process.env.LOKALISE_PROJECT_ID || '';

if (!LOKALISE_API_TOKEN || !LOKALISE_PROJECT_ID) {
  console.error('Error: LOKALISE_API_TOKEN or LOKALISE_PROJECT_ID is missing in environment variables.');
  process.exit(1);
}

const lokaliseApi = new LokaliseApi({ apiKey: LOKALISE_API_TOKEN });

function convertNewlinesInJsonFiles(dir: string) {
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      convertNewlinesInJsonFiles(itemPath);
    } else if (stats.isFile() && itemPath.endsWith('.json')) {
      try {
        const content = fs.readFileSync(itemPath, 'utf8');

        const jsonObject = JSON.parse(content, (_key, value) => {
          if (typeof value === 'string') {
            return value.replace(/\\n/g, '\n');
          }
          return value;
        });

        const formattedContent = JSON.stringify(jsonObject, null, 2);

        fs.writeFileSync(itemPath, formattedContent, 'utf8');
      } catch (error) {
        console.error(`Error processing ${itemPath}:`, error);
      }
    } else {
      console.warn(`Skipping non-JSON file or directory: ${itemPath}`);
    }
  });
}

function extractTranslations(zipFilePath: string, outputDir: string) {
  try {
    console.log('Extracting translations...');

    const zip = new AdmZip(zipFilePath);
    zip.getEntries().forEach((entry) => {
      if (!entry.isDirectory) {
        const adjustedEntryName = entry.entryName.startsWith('locale/') ? entry.entryName.replace(/^locale\//, '') : entry.entryName;
        // Lokalise 언어 코드 → 로컬 디렉토리 이름 매핑.
        // Lokalise 가 ISO 코드 그대로 내려주므로 (en-US, fr 등) 그대로 사용.
        const langDirMap: Record<string, string> = {
          ko: 'ko',
          es: 'es',
          de: 'de',
          ja: 'ja',
          ms: 'ms',
          'en-US': 'en-US',
          en_US: 'en-US',
          fr: 'fr',
        };
        const directory = adjustedEntryName.split('/')[0];
        const fileName = adjustedEntryName.split('/')[1];
        // core-api 는 Admin* namespace 를 사용하지 않으므로 skip
        if (fileName?.startsWith('Admin')) {
          return;
        }
        const adjustedDirectory = langDirMap[directory];
        if (!adjustedDirectory) {
          console.warn(`[i18n] unknown locale directory in zip: ${directory} (entry=${entry.entryName}) — skipped`);
          return;
        }
        const filePath = path.join(outputDir, `${adjustedDirectory}/${fileName}`);

        const parentDir = path.dirname(filePath);
        if (!fs.existsSync(parentDir)) {
          console.log(`Creating directory: ${parentDir}`);
          fs.mkdirSync(parentDir, { recursive: true });
        }

        const fileContent = zip.readFile(entry);
        if (!fileContent) {
          console.error(`Error: Failed to read content for ${entry.entryName}`);
          return;
        }

        fs.writeFileSync(filePath, fileContent as unknown as Parameters<typeof fs.writeFileSync>[1]);
      }
    });

    console.log('All translation files extracted successfully.');

    fs.unlinkSync(zipFilePath);

    convertNewlinesInJsonFiles(outputDir);
  } catch (error) {
    console.error('Error while extracting translations: ', error);
  }
}

async function downloadTranslations() {
  try {
    console.log('Requesting export...');
    const response = await lokaliseApi.files().download(LOKALISE_PROJECT_ID, {
      format: 'json',
      placeholder_format: 'i18n',
      original_filenames: true,
    });

    const bundleUrl = response.bundle_url;
    console.log('Downloading file from:', bundleUrl);

    const outputDir = path.resolve('./src/i18n/locale');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const zipFilePath = path.join(outputDir, 'translations.zip');
    const file = fs.createWriteStream(zipFilePath);

    https.get(bundleUrl, (res) => {
      res.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('Translation files downloaded to:', zipFilePath);

        extractTranslations(zipFilePath, outputDir);
      });
    });
  } catch (error) {
    console.error('Error while downloading translations:', error);
  }
}

downloadTranslations();

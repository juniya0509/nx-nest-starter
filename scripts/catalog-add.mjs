#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { parse, stringify } from 'yaml';
import { select, checkbox, input, confirm } from '@inquirer/prompts';

// ===== 유틸: 워크스페이스의 앱/라이브러리 목록 읽기 =====
function getApps() {
  const apps = [];
  if (existsSync('apps')) {
    for (const name of readdirSync('apps')) {
      const pkgPath = `apps/${name}/package.json`;
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        apps.push({ name, pkgName: pkg.name, type: 'apps' });
      }
    }
  }
  return apps;
}

function getLibs() {
  const libs = [];
  if (existsSync('libs')) {
    for (const name of readdirSync('libs')) {
      const pkgPath = `libs/${name}/package.json`;
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        libs.push({ name, pkgName: pkg.name, type: 'libs' });
      }
    }
  }
  return libs;
}

// ===== catalog 검증 =====
function validateCatalog(catalog) {
  const corrupted = Object.entries(catalog).filter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, version]) =>
      typeof version !== 'string' ||
      version === 'catalog:' ||
      version.startsWith('catalog:')
  );

  if (corrupted.length > 0) {
    console.error('\n❌ pnpm-workspace.yaml의 catalog에 망가진 항목이 있습니다:\n');
    corrupted.forEach(([pkg, version]) => {
      console.error(`   ${pkg}: ${version}`);
    });
    console.error('\n💡 해결 방법:');
    console.error('   1. pnpm-workspace.yaml을 직접 열어서 실제 버전으로 수정');
    console.error('   2. 실제 버전 확인: pnpm view <패키지명> version\n');
    process.exit(1);
  }
}

// ===== 버전 검증 =====
function validateVersion(pkg, version) {
  if (version === 'catalog:' || version.startsWith('catalog:')) {
    console.error(
      `\n❌ ${pkg}의 버전이 "${version}"입니다.`
    );
    console.error('   이미 catalog 참조로 설정되어 있을 수 있습니다.');
    console.error(`   pnpm view ${pkg} version 명령어로 실제 버전을 확인하세요.\n`);
    return false;
  }
  if (version.startsWith('workspace:')) {
    console.error(
      `\n❌ ${pkg}의 버전이 "${version}"입니다.`
    );
    console.error('   워크스페이스 패키지는 catalog로 관리할 수 없습니다.\n');
    return false;
  }
  return true;
}

// ===== 범위 선택 =====
async function selectScope() {
  const apps = getApps();
  const libs = getLibs();
  const choices = [];

  if (apps.length > 0) {
    choices.push({ name: `📱 apps만 보기 (${apps.length}개)`, value: 'apps' });
  }
  if (libs.length > 0) {
    choices.push({ name: `📚 libs만 보기 (${libs.length}개)`, value: 'libs' });
  }
  if (apps.length > 0 && libs.length > 0) {
    choices.push({
      name: `🌍 apps + libs 모두 보기 (${apps.length + libs.length}개)`,
      value: 'all',
    });
  }

  if (choices.length === 0) {
    console.error('❌ apps/ 또는 libs/ 폴더에 프로젝트가 없습니다.');
    process.exit(1);
  }

  return await select({ message: '어느 범위에서 선택할까요?', choices });
}

// ===== 프로젝트 체크박스 선택 =====
async function selectTargets(scope) {
  const apps = getApps();
  const libs = getLibs();

  let items = [];
  if (scope === 'apps') items = apps;
  else if (scope === 'libs') items = libs;
  else if (scope === 'all') items = [...apps, ...libs];

  const choices = items.map((item) => ({
    name: `${item.type === 'apps' ? '📱' : '📚'} ${item.name} (${item.type === 'apps' ? 'app' : 'lib'})`,
    value: item,
    checked: scope === 'apps' || scope === 'libs',
  }));

  return await checkbox({
    message: '설치할 프로젝트를 선택하세요 (스페이스로 토글, a로 전체 토글, Enter로 확정):',
    choices,
    validate: (values) => values.length > 0 || '하나 이상의 프로젝트를 선택하세요',
  });
}

// ===== 메인 =====
async function main() {
  console.log('\n🎯 pnpm Catalog 패키지 추가 도우미\n');

  // 0. catalog 사전 검증
  const yamlPath = 'pnpm-workspace.yaml';
  const yamlContent = readFileSync(yamlPath, 'utf-8');
  const workspace = parse(yamlContent);
  const existingCatalog = workspace.catalog || {};

  validateCatalog(existingCatalog);

  // 1. 범위 선택
  const scope = await selectScope();

  // 2. 프로젝트 체크박스 선택
  const targets = await selectTargets(scope);

  // 3. 의존성 타입 선택
  const depType = await select({
    message: '어떤 타입으로 설치할까요?',
    choices: [
      { name: '📦 dependencies (런타임)', value: 'dependencies' },
      { name: '🔧 devDependencies (개발 도구/타입)', value: 'devDependencies' },
    ],
  });

  // 4. 패키지 이름 입력
  const packagesInput = await input({
    message: '패키지 이름을 입력하세요 (공백으로 구분):',
    validate: (value) => !!value.trim() || '하나 이상의 패키지를 입력하세요',
  });

  const packages = packagesInput.trim().split(/\s+/);

  // 5. catalog에 이미 있는 패키지와 새 패키지 분리
  const alreadyInCatalog = packages.filter((pkg) => existingCatalog[pkg]);
  const newPackages = packages.filter((pkg) => !existingCatalog[pkg]);

  if (alreadyInCatalog.length > 0) {
    console.log('\nℹ️  이미 catalog에 있는 패키지:');
    alreadyInCatalog.forEach((pkg) => {
      console.log(`   ${pkg}: ${existingCatalog[pkg]}`);
    });
  }

  if (newPackages.length > 0) {
    console.log('\n🆕 새로 설치할 패키지:');
    newPackages.forEach((pkg) => console.log(`   ${pkg}`));
  }

  // 6. 확인
  console.log('\n📋 설치 정보:');
  console.log(`   대상 프로젝트 (${targets.length}개):`);
  targets.forEach((t) => console.log(`     - ${t.type}/${t.name}`));
  console.log(`   타입: ${depType}\n`);

  const proceed = await confirm({ message: '진행할까요?', default: true });

  if (!proceed) {
    console.log('⏹  취소되었습니다.');
    process.exit(0);
  }

  // 7. 버전 결정
  const versions = {};

  // 7-1. 이미 catalog에 있는 것들 → 기존 버전 사용
  for (const pkg of alreadyInCatalog) {
    versions[pkg] = existingCatalog[pkg];
  }

  // 7-2. 새 패키지만 임시 설치
  if (newPackages.length > 0) {
    console.log(`\n📦 ${newPackages.length}개 새 패키지 임시 설치 중...\n`);

    const devArg = depType === 'devDependencies' ? '-D' : '';
    const firstTarget = targets[0];

    try {
      execSync(
        `pnpm add ${devArg} --filter ${firstTarget.pkgName} ${newPackages.join(' ')}`,
        { stdio: 'inherit' }
      );
    } catch {
      console.error('\n❌ 설치 실패');
      process.exit(1);
    }

    // 설치된 버전 읽기
    const firstPkgPath = `${firstTarget.type}/${firstTarget.name}/package.json`;
    const firstPkg = JSON.parse(readFileSync(firstPkgPath, 'utf-8'));
    const allDeps = { ...firstPkg.dependencies, ...firstPkg.devDependencies };

    for (const pkg of newPackages) {
      if (!allDeps[pkg]) {
        console.warn(`⚠️  ${pkg} 버전을 찾을 수 없습니다. 건너뜁니다.`);
        continue;
      }

      const version = allDeps[pkg];

      // 안전장치: 잘못된 버전 거부
      if (!validateVersion(pkg, version)) {
        process.exit(1);
      }

      versions[pkg] = version;
    }
  }

  if (Object.keys(versions).length === 0) {
    console.error('\n❌ 처리할 패키지가 없습니다.');
    process.exit(1);
  }

  console.log('\n✅ 사용할 버전:');
  Object.entries(versions).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

  // 8. pnpm-workspace.yaml 업데이트 (새 패키지만)
  if (newPackages.length > 0) {
    workspace.catalog = workspace.catalog || {};
    for (const pkg of newPackages) {
      if (versions[pkg]) {
        workspace.catalog[pkg] = versions[pkg];
      }
    }
    writeFileSync(yamlPath, stringify(workspace));
    console.log(`\n📝 ${yamlPath} 업데이트 완료`);
  }

  // 9. 모든 대상 프로젝트의 package.json에 "catalog:" 추가
  for (const target of targets) {
    const pkgPath = `${target.type}/${target.name}/package.json`;
    const projectPkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

    projectPkg[depType] = projectPkg[depType] || {};

    for (const pkg of Object.keys(versions)) {
      projectPkg[depType][pkg] = 'catalog:';
    }

    writeFileSync(pkgPath, JSON.stringify(projectPkg, null, 2) + '\n');
    console.log(`📝 ${pkgPath} → "catalog:" 참조로 변경`);
  }

  // 10. 재설치
  console.log('\n🔄 pnpm install 재실행...\n');
  try {
    execSync('pnpm install', { stdio: 'inherit' });
  } catch {
    console.error('\n❌ pnpm install 실패');
    process.exit(1);
  }

  console.log('\n🎉 완료! Catalog에 추가되고 프로젝트에 적용되었습니다.\n');
}

main().catch((err) => {
  if (err.name === 'ExitPromptError') {
    console.log('\n⏹  취소되었습니다.');
    process.exit(0);
  }
  console.error('\n❌ 에러 발생:', err.message);
  process.exit(1);
});
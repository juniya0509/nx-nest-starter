import { Enum, EnumConstNames, EnumType } from 'ts-jenum';

@Enum('countryCode')
export class Country<C extends string = string> extends EnumType<Country>() {
  // A
  static readonly AD = new Country('AD', 'Andorra', 'Andorra', '안도라', '+376');
  static readonly AE = new Country('AE', 'United Arab Emirates', 'الإمارات العربية المتحدة', '아랍에미리트', '+971');
  static readonly AF = new Country('AF', 'Afghanistan', 'افغانستان', '아프가니스탄', '+93');
  static readonly AG = new Country('AG', 'Antigua and Barbuda', 'Antigua and Barbuda', '앤티가 바부다', '+1');
  static readonly AI = new Country('AI', 'Anguilla', 'Anguilla', '앵귈라', '+1');
  static readonly AL = new Country('AL', 'Albania', 'Shqipëria', '알바니아', '+355');
  static readonly AM = new Country('AM', 'Armenia', 'Հայաստան', '아르메니아', '+374');
  static readonly AN = new Country('AN', 'Netherlands Antilles', 'Nederlandse Antillen', '네덜란드령 안틸레스', '+599');
  static readonly AO = new Country('AO', 'Angola', 'Angola', '앙골라', '+244');
  static readonly AQ = new Country('AQ', 'Antarctica', 'Antarctica', '남극', '+672');
  static readonly AR = new Country('AR', 'Argentina', 'Argentina', '아르헨티나', '+54');
  static readonly AS = new Country('AS', 'American Samoa', 'American Samoa', '아메리칸사모아', '+1');
  static readonly AT = new Country('AT', 'Austria', 'Österreich', '오스트리아', '+43');
  static readonly AU = new Country('AU', 'Australia', 'Australia', '호주', '+61');
  static readonly AW = new Country('AW', 'Aruba', 'Aruba', '아루바', '+297');
  static readonly AX = new Country('AX', 'Åland Islands', 'Åland', '올란드 제도', '+358-18');
  static readonly AZ = new Country('AZ', 'Azerbaijan', 'Azərbaycan', '아제르바이잔', '+994');

  // B
  static readonly BA = new Country('BA', 'Bosnia and Herzegovina', 'Bosna i Hercegovina', '보스니아 헤르체고비나', '+387');
  static readonly BB = new Country('BB', 'Barbados', 'Barbados', '바베이도스', '+1');
  static readonly BD = new Country('BD', 'Bangladesh', 'বাংলাদেশ', '방글라데시', '+880');
  static readonly BE = new Country('BE', 'Belgium', 'België', '벨기에', '+32');
  static readonly BF = new Country('BF', 'Burkina Faso', 'Burkina Faso', '부르키나파소', '+226');
  static readonly BG = new Country('BG', 'Bulgaria', 'България', '불가리아', '+359');
  static readonly BH = new Country('BH', 'Bahrain', 'البحرين', '바레인', '+973');
  static readonly BI = new Country('BI', 'Burundi', 'Burundi', '부룬디', '+257');
  static readonly BJ = new Country('BJ', 'Benin', 'Bénin', '베냉', '+229');
  static readonly BL = new Country('BL', 'Saint Barthélemy', 'Saint-Barthélemy', '생바르텔레미', '+590');
  static readonly BM = new Country('BM', 'Bermuda', 'Bermuda', '버뮤다', '+1');
  static readonly BN = new Country('BN', 'Brunei Darussalam', 'Brunei Darussalam', '브루나이', '+673');
  static readonly BO = new Country('BO', 'Bolivia (Plurinational State of)', 'Bolivia', '볼리비아', '+591');
  static readonly BQ = new Country(
    'BQ',
    'Bonaire, Sint Eustatius and Saba',
    'Caribisch Nederland',
    '보네르, 신트외스타티위스, 사바',
    '+599',
  );
  static readonly BR = new Country('BR', 'Brazil', 'Brasil', '브라질', '+55');
  static readonly BS = new Country('BS', 'Bahamas', 'Bahamas', '바하마', '+1');
  static readonly BT = new Country('BT', 'Bhutan', 'འབྲུག', '부탄', '+975');
  static readonly BV = new Country('BV', 'Bouvet Island', 'Bouvetøya', '부베섬', '+47');
  static readonly BW = new Country('BW', 'Botswana', 'Botswana', '보츠와나', '+267');
  static readonly BY = new Country('BY', 'Belarus', 'Беларусь', '벨라루스', '+375');
  static readonly BZ = new Country('BZ', 'Belize', 'Belize', '벨리즈', '+501');

  // C
  static readonly CA = new Country('CA', 'Canada', 'Canada', '캐나다', '+1');
  static readonly CC = new Country('CC', 'Cocos (Keeling) Islands', 'Cocos (Keeling) Islands', '코코스 제도', '+61');
  static readonly CD = new Country('CD', 'Congo, Democratic Republic of the', 'République démocratique du Congo', '콩고민주공화국', '+243');
  static readonly CF = new Country('CF', 'Central African Republic', 'République centrafricaine', '중앙아프리카공화국', '+236');
  static readonly CG = new Country('CG', 'Congo', 'Congo', '콩고', '+242');
  static readonly CH = new Country('CH', 'Switzerland', 'Schweiz', '스위스', '+41');
  static readonly CI = new Country('CI', "Cote d'Ivoire", "Côte d'Ivoire", '코트디부아르', '+225');
  static readonly CK = new Country('CK', 'Cook Islands', 'Cook Islands', '쿡 제도', '+682');
  static readonly CL = new Country('CL', 'Chile', 'Chile', '칠레', '+56');
  static readonly CM = new Country('CM', 'Cameroon', 'Cameroun', '카메룬', '+237');
  static readonly CN = new Country('CN', 'China', '中国', '중국', '+86');
  static readonly CO = new Country('CO', 'Colombia', 'Colombia', '콜롬비아', '+57');
  static readonly CR = new Country('CR', 'Costa Rica', 'Costa Rica', '코스타리카', '+506');
  static readonly CU = new Country('CU', 'Cuba', 'Cuba', '쿠바', '+53');
  static readonly CV = new Country('CV', 'Cabo Verde', 'Cabo Verde', '카보베르데', '+238');
  static readonly CW = new Country('CW', 'Curaçao', 'Curaçao', '퀴라소', '+599');
  static readonly CX = new Country('CX', 'Christmas Island', 'Christmas Island', '크리스마스섬', '+61');
  static readonly CY = new Country('CY', 'Cyprus', 'Κύπρος', '키프로스', '+357');
  static readonly CZ = new Country('CZ', 'Czech Republic', 'Česká republika', '체코', '+420');

  // D
  static readonly DE = new Country('DE', 'Germany', 'Deutschland', '독일', '+49');
  static readonly DJ = new Country('DJ', 'Djibouti', 'Djibouti', '지부티', '+253');
  static readonly DK = new Country('DK', 'Denmark', 'Danmark', '덴마크', '+45');
  static readonly DM = new Country('DM', 'Dominica', 'Dominica', '도미니카 연방', '+1');
  static readonly DO = new Country('DO', 'Dominican Republic', 'República Dominicana', '도미니카 공화국', '+1');
  static readonly DZ = new Country('DZ', 'Algeria', 'الجزائر', '알제리', '+213');

  // E
  static readonly EC = new Country('EC', 'Ecuador', 'Ecuador', '에콰도르', '+593');
  static readonly EE = new Country('EE', 'Estonia', 'Eesti', '에스토니아', '+372');
  static readonly EG = new Country('EG', 'Egypt', 'مصر', '이집트', '+20');
  static readonly EH = new Country('EH', 'Western Sahara', 'الصحراء الغربية', '서사하라', '+212');
  static readonly ER = new Country('ER', 'Eritrea', 'ኤርትራ', '에리트레아', '+291');
  static readonly ES = new Country('ES', 'Spain', 'España', '스페인', '+34');
  static readonly ET = new Country('ET', 'Ethiopia', 'ኢትዮጵያ', '에티오피아', '+251');

  // F
  static readonly FI = new Country('FI', 'Finland', 'Suomi', '핀란드', '+358');
  static readonly FJ = new Country('FJ', 'Fiji', 'Fiji', '피지', '+679');
  static readonly FK = new Country('FK', 'Falkland Islands (Malvinas)', 'Falkland Islands', '포클랜드 제도', '+500');
  static readonly FM = new Country('FM', 'Micronesia (Federated States of)', 'Micronesia', '미크로네시아 연방', '+691');
  static readonly FO = new Country('FO', 'Faroe Islands', 'Føroyar', '페로 제도', '+298');
  static readonly FR = new Country('FR', 'France', 'France', '프랑스', '+33');

  // G
  static readonly GA = new Country('GA', 'Gabon', 'Gabon', '가봉', '+241');
  static readonly GB = new Country('GB', 'United Kingdom of Great Britain and Northern Ireland', 'United Kingdom', '영국', '+44');
  static readonly GD = new Country('GD', 'Grenada', 'Grenada', '그레나다', '+1');
  static readonly GE = new Country('GE', 'Georgia', 'საქართველო', '조지아', '+995');
  static readonly GF = new Country('GF', 'French Guiana', 'Guyane française', '프랑스령 기아나', '+594');
  static readonly GG = new Country('GG', 'Guernsey', 'Guernsey', '건지섬', '+44');
  static readonly GH = new Country('GH', 'Ghana', 'Ghana', '가나', '+233');
  static readonly GI = new Country('GI', 'Gibraltar', 'Gibraltar', '지브롤터', '+350');
  static readonly GL = new Country('GL', 'Greenland', 'Kalaallit Nunaat', '그린란드', '+299');
  static readonly GM = new Country('GM', 'Gambia', 'Gambia', '감비아', '+220');
  static readonly GN = new Country('GN', 'Guinea', 'Guinée', '기니', '+224');
  static readonly GP = new Country('GP', 'Guadeloupe', 'Guadeloupe', '과들루프', '+590');
  static readonly GQ = new Country('GQ', 'Equatorial Guinea', 'Guinea Ecuatorial', '적도기니', '+240');
  static readonly GR = new Country('GR', 'Greece', 'Ελλάδα', '그리스', '+30');
  static readonly GS = new Country(
    'GS',
    'South Georgia and the South Sandwich Islands',
    'South Georgia',
    '사우스조지아 사우스샌드위치 제도',
    '+500',
  );
  static readonly GT = new Country('GT', 'Guatemala', 'Guatemala', '과테말라', '+502');
  static readonly GU = new Country('GU', 'Guam', 'Guam', '괌', '+1');
  static readonly GW = new Country('GW', 'Guinea-Bissau', 'Guiné-Bissau', '기니비사우', '+245');
  static readonly GY = new Country('GY', 'Guyana', 'Guyana', '가이아나', '+592');

  // H
  static readonly HK = new Country('HK', 'Hong Kong', '香港', '홍콩', '+852');
  static readonly HM = new Country(
    'HM',
    'Heard Island and McDonald Islands',
    'Heard Island and McDonald Islands',
    '허드 맥도널드 제도',
    '+672',
  );
  static readonly HN = new Country('HN', 'Honduras', 'Honduras', '온두라스', '+504');
  static readonly HR = new Country('HR', 'Croatia', 'Hrvatska', '크로아티아', '+385');
  static readonly HT = new Country('HT', 'Haiti', 'Haïti', '아이티', '+509');
  static readonly HU = new Country('HU', 'Hungary', 'Magyarország', '헝가리', '+36');

  // I
  static readonly ID = new Country('ID', 'Indonesia', 'Indonesia', '인도네시아', '+62');
  static readonly IE = new Country('IE', 'Ireland', 'Éire', '아일랜드', '+353');
  static readonly IL = new Country('IL', 'Israel', 'ישראל', '이스라엘', '+972');
  static readonly IM = new Country('IM', 'Isle of Man', 'Isle of Man', '맨섬', '+44');
  static readonly IN = new Country('IN', 'India', 'भारत', '인도', '+91');
  static readonly IO = new Country('IO', 'British Indian Ocean Territory', 'British Indian Ocean Territory', '영국령 인도양 지역', '+246');
  static readonly IQ = new Country('IQ', 'Iraq', 'العراق', '이라크', '+964');
  static readonly IR = new Country('IR', 'Iran (Islamic Republic of)', 'ایران', '이란', '+98');
  static readonly IS = new Country('IS', 'Iceland', 'Ísland', '아이슬란드', '+354');
  static readonly IT = new Country('IT', 'Italy', 'Italia', '이탈리아', '+39');

  // J
  static readonly JE = new Country('JE', 'Jersey', 'Jersey', '저지섬', '+44');
  static readonly JM = new Country('JM', 'Jamaica', 'Jamaica', '자메이카', '+1');
  static readonly JO = new Country('JO', 'Jordan', 'الأردن', '요르단', '+962');
  static readonly JP = new Country('JP', 'Japan', '日本', '일본', '+81');

  // K
  static readonly KE = new Country('KE', 'Kenya', 'Kenya', '케냐', '+254');
  static readonly KG = new Country('KG', 'Kyrgyzstan', 'Кыргызстан', '키르기스스탄', '+996');
  static readonly KH = new Country('KH', 'Cambodia', 'កម្ពុជា', '캄보디아', '+855');
  static readonly KI = new Country('KI', 'Kiribati', 'Kiribati', '키리바시', '+686');
  static readonly KM = new Country('KM', 'Comoros', 'القمر', '코모로', '+269');
  static readonly KN = new Country('KN', 'Saint Kitts and Nevis', 'Saint Kitts and Nevis', '세인트키츠 네비스', '+1');
  static readonly KP = new Country('KP', "Korea (Democratic People's Republic of)", '조선민주주의인민공화국', '북한', '+850');
  static readonly KR = new Country('KR', 'Korea, Republic of', '대한민국', '대한민국', '+82');
  static readonly KW = new Country('KW', 'Kuwait', 'الكويت', '쿠웨이트', '+965');
  static readonly KY = new Country('KY', 'Cayman Islands', 'Cayman Islands', '케이맨 제도', '+1');
  static readonly KZ = new Country('KZ', 'Kazakhstan', 'Қазақстан', '카자흐스탄', '+7');

  // L
  static readonly LA = new Country('LA', "Lao People's Democratic Republic", 'ປະເທດລາວ', '라오스', '+856');
  static readonly LB = new Country('LB', 'Lebanon', 'لبنان', '레바논', '+961');
  static readonly LC = new Country('LC', 'Saint Lucia', 'Saint Lucia', '세인트루시아', '+1');
  static readonly LI = new Country('LI', 'Liechtenstein', 'Liechtenstein', '리히텐슈타인', '+423');
  static readonly LK = new Country('LK', 'Sri Lanka', 'ශ්‍රී ලංකා', '스리랑카', '+94');
  static readonly LR = new Country('LR', 'Liberia', 'Liberia', '라이베리아', '+231');
  static readonly LS = new Country('LS', 'Lesotho', 'Lesotho', '레소토', '+266');
  static readonly LT = new Country('LT', 'Lithuania', 'Lietuva', '리투아니아', '+370');
  static readonly LU = new Country('LU', 'Luxembourg', 'Luxembourg', '룩셈부르크', '+352');
  static readonly LV = new Country('LV', 'Latvia', 'Latvija', '라트비아', '+371');
  static readonly LY = new Country('LY', 'Libya', 'ليبيا', '리비아', '+218');

  // M
  static readonly MA = new Country('MA', 'Morocco', 'المغرب', '모로코', '+212');
  static readonly MC = new Country('MC', 'Monaco', 'Monaco', '모나코', '+377');
  static readonly MD = new Country('MD', 'Moldova, Republic of', 'Moldova', '몰도바', '+373');
  static readonly ME = new Country('ME', 'Montenegro', 'Crna Gora', '몬테네그로', '+382');
  static readonly MF = new Country('MF', 'Saint Martin (French part)', 'Saint-Martin', '생마르탱 (프랑스령)', '+590');
  static readonly MG = new Country('MG', 'Madagascar', 'Madagasikara', '마다가스카르', '+261');
  static readonly MH = new Country('MH', 'Marshall Islands', 'Aolepān Aorōkin M̧ajeļ', '마셜 제도', '+692');
  static readonly MK = new Country('MK', 'North Macedonia', 'Северна Македонија', '북마케도니아', '+389');
  static readonly ML = new Country('ML', 'Mali', 'Mali', '말리', '+223');
  static readonly MM = new Country('MM', 'Myanmar', 'မြန်မာ', '미얀마', '+95');
  static readonly MN = new Country('MN', 'Mongolia', 'Монгол', '몽골', '+976');
  static readonly MO = new Country('MO', 'Macao', '澳門', '마카오', '+853');
  static readonly MP = new Country('MP', 'Northern Mariana Islands', 'Northern Mariana Islands', '북마리아나 제도', '+1');
  static readonly MQ = new Country('MQ', 'Martinique', 'Martinique', '마르티니크', '+596');
  static readonly MR = new Country('MR', 'Mauritania', 'موريتانيا', '모리타니', '+222');
  static readonly MS = new Country('MS', 'Montserrat', 'Montserrat', '몬트세랫', '+1');
  static readonly MT = new Country('MT', 'Malta', 'Malta', '몰타', '+356');
  static readonly MU = new Country('MU', 'Mauritius', 'Maurice', '모리셔스', '+230');
  static readonly MV = new Country('MV', 'Maldives', 'ދިވެހިރާއްޖެ', '몰디브', '+960');
  static readonly MW = new Country('MW', 'Malawi', 'Malawi', '말라위', '+265');
  static readonly MX = new Country('MX', 'Mexico', 'México', '멕시코', '+52');
  static readonly MY = new Country('MY', 'Malaysia', 'Malaysia', '말레이시아', '+60');
  static readonly MZ = new Country('MZ', 'Mozambique', 'Moçambique', '모잠비크', '+258');

  // N
  static readonly NA = new Country('NA', 'Namibia', 'Namibia', '나미비아', '+264');
  static readonly NC = new Country('NC', 'New Caledonia', 'Nouvelle-Calédonie', '뉴칼레도니아', '+687');
  static readonly NE = new Country('NE', 'Niger', 'Niger', '니제르', '+227');
  static readonly NF = new Country('NF', 'Norfolk Island', 'Norfolk Island', '노퍽섬', '+672');
  static readonly NG = new Country('NG', 'Nigeria', 'Nigeria', '나이지리아', '+234');
  static readonly NI = new Country('NI', 'Nicaragua', 'Nicaragua', '니카라과', '+505');
  static readonly NL = new Country('NL', 'Netherlands', 'Nederland', '네덜란드', '+31');
  static readonly NO = new Country('NO', 'Norway', 'Norge', '노르웨이', '+47');
  static readonly NP = new Country('NP', 'Nepal', 'नेपाल', '네팔', '+977');
  static readonly NR = new Country('NR', 'Nauru', 'Nauru', '나우루', '+674');
  static readonly NU = new Country('NU', 'Niue', 'Niue', '니우에', '+683');
  static readonly NZ = new Country('NZ', 'New Zealand', 'Aotearoa', '뉴질랜드', '+64');

  // O
  static readonly OM = new Country('OM', 'Oman', 'عمان', '오만', '+968');

  // P
  static readonly PA = new Country('PA', 'Panama', 'Panamá', '파나마', '+507');
  static readonly PE = new Country('PE', 'Peru', 'Perú', '페루', '+51');
  static readonly PF = new Country('PF', 'French Polynesia', 'Polynésie française', '프랑스령 폴리네시아', '+689');
  static readonly PG = new Country('PG', 'Papua New Guinea', 'Papua New Guinea', '파푸아뉴기니', '+675');
  static readonly PH = new Country('PH', 'Philippines', 'Pilipinas', '필리핀', '+63');
  static readonly PK = new Country('PK', 'Pakistan', 'پاکستان', '파키스탄', '+92');
  static readonly PL = new Country('PL', 'Poland', 'Polska', '폴란드', '+48');
  static readonly PM = new Country('PM', 'Saint Pierre and Miquelon', 'Saint-Pierre-et-Miquelon', '생피에르 미클롱', '+508');
  static readonly PN = new Country('PN', 'Pitcairn', 'Pitcairn', '핏케언 제도', '+870');
  static readonly PR = new Country('PR', 'Puerto Rico', 'Puerto Rico', '푸에르토리코', '+1');
  static readonly PS = new Country('PS', 'Palestine, State of', 'فلسطين', '팔레스타인', '+970');
  static readonly PT = new Country('PT', 'Portugal', 'Portugal', '포르투갈', '+351');
  static readonly PW = new Country('PW', 'Palau', 'Belau', '팔라우', '+680');
  static readonly PY = new Country('PY', 'Paraguay', 'Paraguay', '파라과이', '+595');

  // Q
  static readonly QA = new Country('QA', 'Qatar', 'قطر', '카타르', '+974');

  // R
  static readonly RE = new Country('RE', 'Réunion', 'La Réunion', '레위니옹', '+262');
  static readonly RO = new Country('RO', 'Romania', 'România', '루마니아', '+40');
  static readonly RS = new Country('RS', 'Serbia', 'Србија', '세르비아', '+381');
  static readonly RU = new Country('RU', 'Russian Federation', 'Россия', '러시아', '+7');
  static readonly RW = new Country('RW', 'Rwanda', 'Rwanda', '르완다', '+250');

  // S
  static readonly SA = new Country('SA', 'Saudi Arabia', 'العربية السعودية', '사우디아라비아', '+966');
  static readonly SB = new Country('SB', 'Solomon Islands', 'Solomon Islands', '솔로몬 제도', '+677');
  static readonly SC = new Country('SC', 'Seychelles', 'Seychelles', '세이셸', '+248');
  static readonly SD = new Country('SD', 'Sudan', 'السودان', '수단', '+249');
  static readonly SE = new Country('SE', 'Sweden', 'Sverige', '스웨덴', '+46');
  static readonly SG = new Country('SG', 'Singapore', 'Singapore', '싱가포르', '+65');
  static readonly SH = new Country('SH', 'Saint Helena, Ascension and Tristan da Cunha', 'Saint Helena', '세인트헬레나', '+290');
  static readonly SI = new Country('SI', 'Slovenia', 'Slovenija', '슬로베니아', '+386');
  static readonly SJ = new Country('SJ', 'Svalbard and Jan Mayen', 'Svalbard og Jan Mayen', '스발바르 얀마옌', '+47');
  static readonly SK = new Country('SK', 'Slovakia', 'Slovensko', '슬로바키아', '+421');
  static readonly SL = new Country('SL', 'Sierra Leone', 'Sierra Leone', '시에라리온', '+232');
  static readonly SM = new Country('SM', 'San Marino', 'San Marino', '산마리노', '+378');
  static readonly SN = new Country('SN', 'Senegal', 'Sénégal', '세네갈', '+221');
  static readonly SO = new Country('SO', 'Somalia', 'Soomaaliya', '소말리아', '+252');
  static readonly SR = new Country('SR', 'Suriname', 'Suriname', '수리남', '+597');
  static readonly SS = new Country('SS', 'South Sudan', 'South Sudan', '남수단', '+211');
  static readonly ST = new Country('ST', 'Sao Tome and Principe', 'São Tomé e Príncipe', '상투메 프린시페', '+239');
  static readonly SV = new Country('SV', 'El Salvador', 'El Salvador', '엘살바도르', '+503');
  static readonly SX = new Country('SX', 'Sint Maarten (Dutch part)', 'Sint Maarten', '신트마르턴 (네덜란드령)', '+1');
  static readonly SY = new Country('SY', 'Syrian Arab Republic', 'سوريا', '시리아', '+963');
  static readonly SZ = new Country('SZ', 'Eswatini', 'eSwatini', '에스와티니', '+268');

  // T
  static readonly TC = new Country('TC', 'Turks and Caicos Islands', 'Turks and Caicos Islands', '터크스 케이커스 제도', '+1');
  static readonly TD = new Country('TD', 'Chad', 'Tchad', '차드', '+235');
  static readonly TF = new Country('TF', 'French Southern Territories', 'Terres australes françaises', '프랑스령 남방 및 남극지역', '+262');
  static readonly TG = new Country('TG', 'Togo', 'Togo', '토고', '+228');
  static readonly TH = new Country('TH', 'Thailand', 'ประเทศไทย', '태국', '+66');
  static readonly TJ = new Country('TJ', 'Tajikistan', 'Тоҷикистон', '타지키스탄', '+992');
  static readonly TK = new Country('TK', 'Tokelau', 'Tokelau', '토켈라우', '+690');
  static readonly TL = new Country('TL', 'Timor-Leste', 'Timor-Leste', '동티모르', '+670');
  static readonly TM = new Country('TM', 'Turkmenistan', 'Türkmenistan', '투르크메니스탄', '+993');
  static readonly TN = new Country('TN', 'Tunisia', 'تونس', '튀니지', '+216');
  static readonly TO = new Country('TO', 'Tonga', 'Tonga', '통가', '+676');
  static readonly TR = new Country('TR', 'Turkey', 'Türkiye', '튀르키예', '+90');
  static readonly TT = new Country('TT', 'Trinidad and Tobago', 'Trinidad and Tobago', '트리니다드 토바고', '+1');
  static readonly TV = new Country('TV', 'Tuvalu', 'Tuvalu', '투발루', '+688');
  static readonly TW = new Country('TW', 'Taiwan, Province of China', '臺灣', '대만', '+886');
  static readonly TZ = new Country('TZ', 'Tanzania, United Republic of', 'Tanzania', '탄자니아', '+255');

  // U
  static readonly UA = new Country('UA', 'Ukraine', 'Україна', '우크라이나', '+380');
  static readonly UG = new Country('UG', 'Uganda', 'Uganda', '우간다', '+256');
  static readonly UM = new Country(
    'UM',
    'United States Minor Outlying Islands',
    'United States Minor Outlying Islands',
    '미국령 군소 제도',
    '+1',
  );
  static readonly US = new Country('US', 'United States of America', 'United States', '미국', '+1');
  static readonly UY = new Country('UY', 'Uruguay', 'Uruguay', '우루과이', '+598');
  static readonly UZ = new Country('UZ', 'Uzbekistan', 'Oʻzbekiston', '우즈베키스탄', '+998');

  // V
  static readonly VA = new Country('VA', 'Holy See', 'Sancta Sedes', '바티칸 시국', '+379');
  static readonly VC = new Country(
    'VC',
    'Saint Vincent and the Grenadines',
    'Saint Vincent and the Grenadines',
    '세인트빈센트 그레나딘',
    '+1',
  );
  static readonly VE = new Country('VE', 'Venezuela (Bolivarian Republic of)', 'Venezuela', '베네수엘라', '+58');
  static readonly VG = new Country('VG', 'Virgin Islands (British)', 'British Virgin Islands', '영국령 버진아일랜드', '+1');
  static readonly VI = new Country('VI', 'Virgin Islands (U.S.)', 'U.S. Virgin Islands', '미국령 버진아일랜드', '+1');
  static readonly VN = new Country('VN', 'Viet Nam', 'Việt Nam', '베트남', '+84');
  static readonly VU = new Country('VU', 'Vanuatu', 'Vanuatu', '바누아투', '+678');

  // W
  static readonly WF = new Country('WF', 'Wallis and Futuna', 'Wallis-et-Futuna', '왈리스 푸투나', '+681');
  static readonly WS = new Country('WS', 'Samoa', 'Sāmoa', '사모아', '+685');

  // X
  static readonly XK = new Country('XK', 'Kosovo', 'Kosova', '코소보', '+383');

  // Y
  static readonly YE = new Country('YE', 'Yemen', 'اليمن', '예멘', '+967');
  static readonly YT = new Country('YT', 'Mayotte', 'Mayotte', '마요트', '+262');

  // Z
  static readonly ZA = new Country('ZA', 'South Africa', 'South Africa', '남아프리카 공화국', '+27');
  static readonly ZM = new Country('ZM', 'Zambia', 'Zambia', '잠비아', '+260');
  static readonly ZW = new Country('ZW', 'Zimbabwe', 'Zimbabwe', '짐바브웨', '+263');

  private constructor(
    readonly countryCode: string,
    readonly englishName: string,
    readonly nativeName: string,
    readonly koreanName: string,
    readonly callingCode: C,
  ) {
    super();
  }

  // 조회 메서드
  static findByCode(code: string): Country | undefined {
    return this.values().find((c) => c.countryCode === code);
  }

  static findByEnglishName(name: string): Country | undefined {
    return this.values().find((c) => c.englishName === name);
  }

  static findByNativeName(name: string): Country | undefined {
    return this.values().find((c) => c.nativeName === name);
  }

  static findByCallingCode(callingCode: string): Country[] {
    // 같은 calling code를 여러 국가가 공유 (예: +1)
    return this.values().filter((c) => c.callingCode === callingCode);
  }

  equals(code: string): boolean {
    return this.countryCode === code;
  }
}

export type CountryCodeUnion = EnumConstNames<typeof Country>;
export const countryCodeList: string[] = Country.values().map((c) => c.countryCode);

// Country 클래스가 generic <C extends string>으로 callingCode 리터럴을 보존하므로
// 정적 인스턴스 union에서 callingCode 필드만 뽑아 union으로 추출
type CountryInstance = (typeof Country)[CountryCodeUnion];
export type CountryCallingCodeUnion = CountryInstance['callingCode'];
export const countryCallingCodeList: CountryCallingCodeUnion[] = [
  ...new Set(Country.values().map((c) => c.callingCode as CountryCallingCodeUnion)),
];

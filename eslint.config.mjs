import nx from '@nx/eslint-plugin';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  // Nx 기본 플랫 설정
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],

  // 전역 ignore
  {
    ignores: [
      '**/dist',
      '**/coverage',
      '**/.nx',
      '**/node_modules',
      '**/out-tsc',
      '**/*.tsbuildinfo',
      '**/jest.config.ts',
    ],
  },

  // TypeScript 규칙
  {
    files: ['**/*.ts'],
    plugins: {
      '@nx': nx,
      '@typescript-eslint': typescriptPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
      
      // TypeScript 완화 (NestJS DI 패턴에 맞춤)
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // 데코레이터 기반 프레임워크에서 빈 생성자, 인터페이스 쓰는 경우 완화
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',

      // import 규칙
      'import/no-unresolved': 'off', // TS에서 이미 체크
      'import/named': 'off',
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': ['error', { maxDepth: 10 }],

      // import 순서 정렬
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroupsExcludedImportTypes: ['builtin'],
          pathGroups: [
            {
              pattern: '{@nestjs,@nestjs/**}',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '{@admin-api,@admin-api/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '{@libs/core-api,@libs/core-api/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '{@libs/core-contract,@libs/core-contract/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '{@libs/core-database,@libs/core-database/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '{@libs/core-domain,@libs/core-domain/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '{@libs/core-enum,@libs/core-enum/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '{@libs/core-util,@libs/core-util/**}',
              group: 'internal',
              position: 'after',
            },
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // Nx 모듈 경계 규칙
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            // 앱은 공유 라이브러리만 참조 가능 (다른 앱의 내부 코드 참조 금지)
            {
              sourceTag: 'scope:app',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            // 레이어 간 의존성 규칙
            // Domain은 Database, Enum, Contract, Util을 참조 가능
            {
              sourceTag: 'layer:domain',
              onlyDependOnLibsWithTags: [
                'layer:database',
                'layer:enum',
                'layer:contract',
                'layer:util',
              ],
            },
            // Database는 Enum, Util 참조 가능
            {
              sourceTag: 'layer:database',
              onlyDependOnLibsWithTags: ['layer:enum', 'layer:util'],
            },
            // Contract는 Enum, Util 참조 가능
            {
              sourceTag: 'layer:contract',
              onlyDependOnLibsWithTags: ['layer:enum', 'layer:util'],
            },
            // Util은 Enum만 참조 가능
            {
              sourceTag: 'layer:util',
              onlyDependOnLibsWithTags: ['layer:enum'],
            },
            // Enum은 아무것도 참조하지 않음 (최하위 레이어)
            {
              sourceTag: 'layer:enum',
              onlyDependOnLibsWithTags: [],
            },
          ],
        },
      ],
    },
  },

  // 테스트 파일 규칙 완화
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/test/**/*.ts',
      '**/__tests__/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-cycle': 'off',
    },
  },
];
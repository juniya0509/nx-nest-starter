import coreTypeOrmConfig from '@libs/core-database/src/mysql/config/TypeOrm.config';

/**
 * batch 앱의 TypeOrm 설정.
 *
 * 현재는 core 영역 (user / user_token / user_oauth / user_device) 의 데이터만 다루므로
 * core 의 기본 설정 그대로 사용한다.
 *
 * admin 영역의 batch 작업이 필요해지면:
 * 1) admin entity 들을 `libs/core-database` 로 이전하거나
 * 2) nx 의 module-boundary 예외를 추가해 admin-api 의 entity 직접 import
 *    중 하나를 적용한 뒤 entities 를 확장한다.
 */
const batchTypeOrmConfig = coreTypeOrmConfig;

export default batchTypeOrmConfig;

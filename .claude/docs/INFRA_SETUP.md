# 인프라 셋업 가이드 (GitHub + AWS)

처음 starter 를 cloud 에 배포하는 운영자/팀원을 위한 **단계별 셋업 가이드**.

zero state 에서 시작해 development / production 환경의 admin-api / core-api / batch 모두 CD 가 동작하는 상태까지 도달합니다.

전체 소요 시간: **3~5시간** (콘솔 클릭 위주, 익숙해지면 2시간).

---

## 목차

1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [공통 셋업 (1회만)](#공통-셋업-1회만)
   - 3-1. [IAM OIDC Provider](#3-1-iam-oidc-provider)
   - 3-2. [IAM Role — GitHub Actions workflow 용](#3-2-iam-role--github-actions-workflow-용)
   - 3-3. [IAM Role — EC2 instance 용](#3-3-iam-role--ec2-instance-용)
   - 3-4. [IAM Role — CodeDeploy service 용](#3-4-iam-role--codedeploy-service-용)
   - 3-5. [ECR repository × 3](#3-5-ecr-repository--3)
   - 3-6. [Security Group × 3](#3-6-security-group--3)
   - 3-7. [Launch Template × 2](#3-7-launch-template--2)
   - 3-8. [GitHub OIDC Provider 등록 확인](#3-8-github-oidc-provider-등록-확인)
4. [환경별 셋업 (development / production 각각)](#환경별-셋업)
   - 4-1. [S3 deploy bucket](#4-1-s3-deploy-bucket)
   - 4-2. [admin-api 인프라 (ALB / TG / ASG / CodeDeploy)](#4-2-admin-api-인프라)
   - 4-3. [core-api 인프라](#4-3-core-api-인프라)
   - 4-4. [batch 인프라 (ASG / CodeDeploy, ALB 없음)](#4-4-batch-인프라)
5. [GitHub 측 셋업](#5-github-측-셋업)
   - 5-1. [Repository Variables](#5-1-repository-variables)
   - 5-2. [Environments 생성](#5-2-environments-생성)
   - 5-3. [.env 파일 작성 + base64 등록](#5-3-env-파일-작성--base64-등록)
6. [첫 배포 검증](#6-첫-배포-검증)
7. [DB schema 초기화](#7-db-schema-초기화)
8. [운영 후 권장 작업](#8-운영-후-권장-작업)
9. [트러블슈팅](#9-트러블슈팅)

---

## 개요

### 전체 흐름

```
GitHub push (develop / master)
  ↓
GitHub Actions workflow
  ├── ci job — lint / test / build / e2e
  └── deploy-<app> jobs (affected 만)
        ├── Docker image build → ECR push (tag = git SHA)
        ├── CodeDeploy bundle (docker-compose + appspec + execute.sh + .env) → S3
        └── aws deploy create-deployment → CodeDeploy 트리거
              ↓
              EC2 ASG (CodeDeploy 가 클론 ASG 만들어 new instance)
                ↓ execute.sh: ECR pull → docker compose up → /v1/health 200
                ↓
              CodeDeploy 가 새 instance 를 TG 에 register
              ALB 가 점진적 traffic shift, old instance deregister 후 종료
```

### 환경 × 앱 매트릭스

|  | admin-api | core-api | batch |
| - | - | - | - |
| 외부 traffic | ✅ ALB | ✅ ALB | ❌ (cron only) |
| 배포 타입 | Blue/Green (single-TG) | Blue/Green (single-TG) | In-place |
| ASG | 1+ instance | 1+ instance | 1 instance |
| 포트 | 3000 | 3000 | 3001 (internal health check) |

### 리소스 네이밍 규칙

| 리소스 | 패턴 | 예 |
| - | - | - |
| IAM Role (workflow) | `nx-nest-starter-github-actions-deploy-role` | |
| IAM Role (EC2) | `nx-nest-starter-ec2-instance-role` | |
| IAM Role (CodeDeploy service) | `nx-nest-starter-codedeploy-service-role` | |
| ECR | `nx-nest-starter-<app>` | `nx-nest-starter-admin-api` |
| S3 bucket | `nx-nest-starter-deploy-<env>` | `nx-nest-starter-deploy-development` |
| Security Group | `nx-nest-starter-<purpose>-sg` | `nx-nest-starter-alb-sg` |
| Launch Template | `nx-nest-starter-<group>-lt` | `nx-nest-starter-app-lt` |
| Target Group | `nns-<app>-<env>-1` (32자 한도) | `nns-admin-api-dev-1` |
| ALB | `nns-<app>-<env>-alb` (32자 한도) | `nns-admin-api-dev-alb` |
| ASG | `nx-nest-starter-<app>-<env>-asg` | `nx-nest-starter-admin-api-development-asg` |
| CodeDeploy App | `nx-nest-starter-<app>-<env>` | `nx-nest-starter-admin-api-development` |
| CodeDeploy DG | `nx-nest-starter-<app>-dg-<env>` | `nx-nest-starter-admin-api-dg-development` |

> TG / ALB 는 AWS 의 **32자 이름 한도** 때문에 `nns-` 축약 prefix 사용.

---

## 사전 준비

체크리스트:

- [ ] AWS 계정 + admin 권한 IAM user 또는 SSO 로그인
- [ ] AWS Region 결정 (이 가이드는 `ap-northeast-2` 서울 기준)
- [ ] **AWS Account ID** 확인 (콘솔 우측 상단 본인 이름 클릭 → 12자리 숫자)
- [ ] GitHub repository 의 admin 권한 (Settings 접근 가능)
- [ ] **GitHub Organization/Repository** 이름 확인 (예: `myorg/nx-nest-starter`)
- [ ] AWS CLI 설치 (선택, 일부 단계에서 사용)
  ```bash
  brew install awscli                  # macOS
  aws configure                        # access key 등록
  aws sts get-caller-identity          # 동작 확인
  ```
- [ ] 사용 가능한 VPC + Subnet 확보. **multi-AZ public subnet 최소 2개** 필요 (ALB 용). default VPC 사용 가능
- [ ] (선택) RDS MySQL 인스턴스 — 각 환경별 (development DB, production DB) — 또는 외부 DB

> 이 가이드의 placeholder:
> - `<AWS_ACCOUNT_ID>`: 본인 AWS Account ID (12자리)
> - `<ORG>/<REPO>`: GitHub `Organization/Repository` 이름
> - `<AWS_REGION>`: 사용 region (예: `ap-northeast-2`)

---

## 공통 셋업 (1회만)

development / production 양쪽이 공유하는 인프라. **한 번만 만들면 됨**.

### 3-1. IAM OIDC Provider

GitHub Actions 가 long-lived access key 없이 AWS Role 을 assume 할 수 있게 함.

1. AWS 콘솔 → **IAM** 진입
2. 좌측 사이드바 → **`ID 제공업체`** (Identity providers)
3. 우측 상단 **`공급자 추가`** 클릭
4. **공급자 유형**: `OpenID Connect`
5. **공급자 URL**: `https://token.actions.githubusercontent.com`
6. **`지문 가져오기`** 클릭 (AWS 가 자동 fetch)
7. **대상** (Audience): `sts.amazonaws.com`
8. **`공급자 추가`** 클릭

> Provider URL 을 브라우저로 열면 404 가 나옵니다 — 정상. 사람이 보는 페이지가 아니라 GitHub Actions 의 OIDC token issuer endpoint 입니다.

생성 완료 후 목록에서 클릭 → ARN 확인:
```
arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com
```

### 3-2. IAM Role — GitHub Actions workflow 용

GitHub Actions 가 ECR push / S3 upload / CodeDeploy 트리거를 위해 assume 할 Role.

#### 권한 정책 먼저 생성

1. IAM → **정책** → **`정책 생성`**
2. JSON 탭 → 다음 붙여넣기 (자신의 AWS Account ID 로 `<AWS_ACCOUNT_ID>` 치환):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EcrAuth",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "EcrPushPull",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "arn:aws:ecr:*:<AWS_ACCOUNT_ID>:repository/nx-nest-starter-*"
    },
    {
      "Sid": "S3DeployBucket",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::nx-nest-starter-deploy-*",
        "arn:aws:s3:::nx-nest-starter-deploy-*/*"
      ]
    },
    {
      "Sid": "CodeDeploy",
      "Effect": "Allow",
      "Action": [
        "codedeploy:CreateDeployment",
        "codedeploy:GetDeployment",
        "codedeploy:GetDeploymentConfig",
        "codedeploy:RegisterApplicationRevision",
        "codedeploy:GetApplicationRevision"
      ],
      "Resource": "*"
    }
  ]
}
```

3. **다음** → 이름: `nx-nest-starter-github-actions-deploy-policy` → **`정책 생성`**

#### Role 생성

1. IAM → **역할** → **`역할 생성`**
2. **신뢰할 수 있는 엔터티 유형**: `사용자 지정 신뢰 정책`
3. 다음 JSON 붙여넣기 (`<AWS_ACCOUNT_ID>` 와 `<ORG>/<REPO>` 치환):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:<ORG>/<REPO>:environment:development",
            "repo:<ORG>/<REPO>:environment:production"
          ]
        }
      }
    }
  ]
}
```

> 이 조건은 **이 repo 의 development/production environment job 만** 이 Role 을 assume 할 수 있게 합니다.

4. **다음** → 위에서 만든 `nx-nest-starter-github-actions-deploy-policy` 검색해 체크 → **다음**
5. 역할 이름: `nx-nest-starter-github-actions-deploy-role` → **`역할 생성`**
6. 생성된 Role 의 **ARN 복사** (다음 GitHub 셋업에서 사용):
   ```
   arn:aws:iam::<AWS_ACCOUNT_ID>:role/nx-nest-starter-github-actions-deploy-role
   ```

### 3-3. IAM Role — EC2 instance 용

EC2 instance 가 ECR pull, S3 deploy zip 다운로드, SSM Session Manager 접속을 위해 사용.

1. IAM → 역할 → **`역할 생성`**
2. **신뢰할 수 있는 엔터티 유형**: `AWS 서비스`
3. **사용 사례**: `EC2` 선택 → **다음**
4. 다음 **관리형 정책 2개** 체크:
   - `AmazonEC2ContainerRegistryReadOnly` (ECR docker pull)
   - `AmazonSSMManagedInstanceCore` (SSM Session Manager — SSH key 없이 접속)
5. **다음** → 역할 이름: `nx-nest-starter-ec2-instance-role` → **`역할 생성`**

#### 인라인 정책 추가 (S3 deploy bucket read)

1. 방금 만든 Role 클릭 → **`권한`** 탭 → **`권한 추가`** → **`인라인 정책 생성`**
2. JSON 탭:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DeployBucketRead",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::nx-nest-starter-deploy-*",
        "arn:aws:s3:::nx-nest-starter-deploy-*/*"
      ]
    }
  ]
}
```

3. **다음** → 이름: `deploy-bucket-read` → **`정책 생성`**

> 콘솔에서 EC2 Role 을 만들면 동일 이름의 **Instance Profile 이 자동 생성**됩니다. Launch Template 에서 사용.

### 3-4. IAM Role — CodeDeploy service 용

CodeDeploy 가 ASG / ALB / EC2 / ELB 를 조작하기 위해 사용.

1. IAM → 역할 → **`역할 생성`**
2. **신뢰할 수 있는 엔터티 유형**: `AWS 서비스`
3. **사용 사례**: **`CodeDeploy`** 검색 → `CodeDeploy` 선택 (ECS / Lambda 아님)
4. **다음** — `AWSCodeDeployRole` 정책 자동 attach 됨
5. **다음** → 역할 이름: `nx-nest-starter-codedeploy-service-role` → **`역할 생성`**

#### 인라인 정책 추가 (Blue/Green Auto Scaling 권한)

`AWSCodeDeployRole` 만으로는 Blue/Green 의 ASG 클론 + ELB swap 권한 부족. 인라인 추가:

1. Role 클릭 → 권한 → 인라인 정책 생성
2. JSON 탭:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BlueGreenAutoScalingAndElb",
      "Effect": "Allow",
      "Action": [
        "autoscaling:CreateAutoScalingGroup",
        "autoscaling:UpdateAutoScalingGroup",
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeScalingActivities",
        "autoscaling:DescribeLifecycleHooks",
        "autoscaling:PutLifecycleHook",
        "autoscaling:DeleteLifecycleHook",
        "autoscaling:RecordLifecycleActionHeartbeat",
        "autoscaling:CompleteLifecycleAction",
        "autoscaling:DeleteAutoScalingGroup",
        "autoscaling:EnableMetricsCollection",
        "autoscaling:SuspendProcesses",
        "autoscaling:ResumeProcesses",
        "autoscaling:AttachLoadBalancers",
        "autoscaling:AttachLoadBalancerTargetGroups",
        "autoscaling:DetachLoadBalancers",
        "autoscaling:DetachLoadBalancerTargetGroups",
        "autoscaling:DescribeLoadBalancers",
        "autoscaling:DescribeLoadBalancerTargetGroups",
        "elasticloadbalancing:DescribeTargetGroups",
        "elasticloadbalancing:DescribeTargetHealth",
        "elasticloadbalancing:RegisterTargets",
        "elasticloadbalancing:DeregisterTargets",
        "elasticloadbalancing:DescribeListeners",
        "elasticloadbalancing:DescribeRules",
        "elasticloadbalancing:ModifyListener",
        "elasticloadbalancing:ModifyRule",
        "ec2:RunInstances",
        "ec2:CreateTags",
        "ec2:TerminateInstances",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeLaunchTemplates",
        "ec2:DescribeLaunchTemplateVersions",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

3. 이름: `codedeploy-blue-green-extras` → 정책 생성

### 3-5. ECR repository × 3

Docker image 저장.

1. AWS 콘솔 검색 → **ECR (Elastic Container Registry)** 진입
2. 좌측 → **프라이빗 레지스트리** → **리포지토리**
3. **`리포지토리 생성`** 클릭. 다음 항목 채워서 **3번 반복**:

| 리포지토리 이름 | 가시성 | 태그 변경 가능성 | 푸시 시 스캔 |
| - | - | - | - |
| `nx-nest-starter-admin-api` | 프라이빗 | 변경 가능 | 활성화 |
| `nx-nest-starter-core-api` | 프라이빗 | 변경 가능 | 활성화 |
| `nx-nest-starter-batch` | 프라이빗 | 변경 가능 | 활성화 |

#### Lifecycle policy (저장 비용 절감)

3개 repository 의 lifecycle 규칙 일괄 적용. AWS CLI:

```bash
for app in admin-api core-api batch; do
  aws ecr put-lifecycle-policy \
    --region ap-northeast-2 \
    --repository-name nx-nest-starter-$app \
    --lifecycle-policy-text '{
      "rules": [
        {"rulePriority":1,"description":"Untagged > 7d expire","selection":{"tagStatus":"untagged","countType":"sinceImagePushed","countUnit":"days","countNumber":7},"action":{"type":"expire"}},
        {"rulePriority":2,"description":"Keep latest 30","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":30},"action":{"type":"expire"}}
      ]
    }'
done
```

콘솔로도 가능: 각 repository → 수명 주기 정책 → 규칙 추가.

### 3-6. Security Group × 3

#### ALB SG — `nx-nest-starter-alb-sg`

ALB 가 인터넷에서 받는 traffic 제어.

1. EC2 → 보안 그룹 → **`보안 그룹 생성`**
2. 이름: `nx-nest-starter-alb-sg`
3. 설명: `ALB inbound 443/80 from internet`
4. VPC: 사용할 VPC
5. **인바운드 규칙**:
   - HTTPS (TCP 443) ← `0.0.0.0/0`
   - HTTP (TCP 80) ← `0.0.0.0/0` (HTTPS 셋업 전 임시 사용 또는 redirect 용)
6. **아웃바운드 규칙**: 기본 (All traffic) 그대로
7. 생성

#### app SG — `nx-nest-starter-app-sg`

admin-api / core-api EC2 가 사용.

1. 보안 그룹 생성
2. 이름: `nx-nest-starter-app-sg`
3. 설명: `App EC2 inbound 3000 from ALB only`
4. VPC: 동일
5. **인바운드 규칙**:
   - 사용자 지정 TCP (3000) ← **`nx-nest-starter-alb-sg`** (SG ID 참조)
6. 아웃바운드: 기본
7. 생성

#### batch SG — `nx-nest-starter-batch-sg`

batch EC2 (단일 인스턴스, ALB 없음) 가 사용.

1. 보안 그룹 생성
2. 이름: `nx-nest-starter-batch-sg`
3. 설명: `Batch EC2 — outbound only (SSM 으로 디버그 접속)`
4. VPC: 동일
5. **인바운드 규칙**: 없음 (SSM Session Manager 사용 시 SSH 22 도 불필요)
6. 아웃바운드: 기본 (All traffic) — DB / ECR / S3 / CodeDeploy 접근 위해 필수
7. 생성

### 3-7. Launch Template × 2

EC2 instance 의 AMI, instance type, IAM Role, user-data 정의.

#### app LT — `nx-nest-starter-app-lt` (admin/core 공통)

1. EC2 → **시작 템플릿** → **`시작 템플릿 생성`**
2. 이름: `nx-nest-starter-app-lt`
3. 설명: `admin-api / core-api 공통`
4. Auto Scaling 지침: **EC2 Auto Scaling** 체크
5. **AMI**: Ubuntu Server 22.04 LTS (HVM, SSD, AMD64) — Quick start 에서 선택
6. **인스턴스 유형**: `t3.medium` (운영) 또는 `t3.small` (개발)
7. **키 페어**: 키 페어 없이 진행 (SSM 사용)
8. **네트워크 설정**: VPC 만 지정, 서브넷 비움 (ASG 가 결정). **보안 그룹**: `nx-nest-starter-app-sg`
9. **스토리지**: 30 GiB gp3 (기본)
10. **고급 세부 정보**:
    - **IAM 인스턴스 프로파일**: `nx-nest-starter-ec2-instance-role`
    - **사용자 데이터** (맨 아래 텍스트박스):

```bash
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

REGION=ap-northeast-2

apt-get update -y
apt-get install -y ca-certificates curl unzip ruby-full wget

# Docker (Ubuntu universe 의 docker.io)
apt-get install -y docker.io
systemctl enable --now docker
usermod -aG docker ubuntu

# Docker Compose v2 plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -sL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# AWS CLI v2
curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
cd /tmp && unzip -q awscliv2.zip && ./aws/install
rm -rf /tmp/awscliv2.zip /tmp/aws

# CodeDeploy agent
cd /tmp
wget -q "https://aws-codedeploy-${REGION}.s3.${REGION}.amazonaws.com/latest/install" -O cd-install
chmod +x cd-install
./cd-install auto
systemctl enable --now codedeploy-agent

mkdir -p /home/ubuntu/deploy
chown -R ubuntu:ubuntu /home/ubuntu/deploy

echo "user-data finished"
```

> `REGION` 변수는 본인 region 으로 수정 (이 가이드는 `ap-northeast-2`).

11. **`시작 템플릿 생성`**

#### batch LT — `nx-nest-starter-batch-lt`

위와 동일하지만 두 항목만 다름:

| 항목 | 값 |
| - | - |
| 이름 | `nx-nest-starter-batch-lt` |
| 인스턴스 유형 | `t3.small` 또는 `t3.micro` (cron only) |
| 보안 그룹 | **`nx-nest-starter-batch-sg`** |
| IAM 인스턴스 프로파일 | `nx-nest-starter-ec2-instance-role` (동일) |
| 사용자 데이터 | 위 스크립트 동일 |

### 3-8. GitHub OIDC Provider 등록 확인

위 3-1 에서 만든 OIDC Provider 의 ARN 이 IAM → 자격 증명 공급자 에서 보이는지 한 번 더 확인:

```
arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com
```

---

## 환경별 셋업

development / production 각각 동일한 작업을 **두 번 반복**합니다. 이 가이드는 `<env>` 자리를 `development` 또는 `production` 으로 치환.

development 환경부터 셋업해 첫 배포 검증 후 → production 으로 진행 권장.

### 4-1. S3 deploy bucket

CodeDeploy zip 보관.

1. S3 → **`버킷 만들기`**
2. 이름: `nx-nest-starter-deploy-<env>`
3. 리전: 동일
4. 객체 소유권: `ACL 비활성화됨`
5. 퍼블릭 액세스 차단: **모든 퍼블릭 액세스 차단** ✅
6. 버전 관리: 비활성화
7. 기본 암호화: `Amazon S3 관리형 키 (SSE-S3)` (기본)
8. 생성

#### Lifecycle 규칙 (30일 후 자동 삭제)

생성된 버킷 → **관리** 탭 → **수명 주기 규칙 만들기**:
- 규칙 이름: `Expire deploy zips after 30d`
- 규칙 범위: 모든 객체에 적용 ✅
- 작업: `객체의 현재 버전 만료`
- 일수: `30`
- 저장

> 글로벌 unique 이름 충돌 시 suffix 추가 (예: `nx-nest-starter-deploy-<env>-<acct-id-끝4자리>`). IAM Role 의 S3 resource pattern (`nx-nest-starter-deploy-*`) 은 그대로 매칭됨.

### 4-2. admin-api 인프라

#### A. Target Group

EC2 → **대상 그룹** → **`대상 그룹 생성`**:

| 항목 | 값 |
| - | - |
| 대상 유형 | `인스턴스` |
| 이름 | `nns-admin-api-<env>-1` |
| 프로토콜 / 포트 | `HTTP` / `3000` |
| VPC | 동일 |
| 프로토콜 버전 | `HTTP1` |
| 상태 검사 경로 | `/v1/health` |
| 고급 → 정상 임계값 | `2` |
| 고급 → 비정상 임계값 | `3` |
| 고급 → 시간 초과 | `5` 초 |
| 고급 → 간격 | `10` 초 |
| 성공 코드 | `200` |

다음 → 대상 등록 안 하고 **`대상 그룹 생성`**

> ⚠️ **TG 는 1개만 만듭니다** — Blue/Green single-TG 패턴. TG 2개 만들면 listener swap stuck 발생.

#### B. ALB

EC2 → 로드 밸런서 → **`로드 밸런서 생성`** → **Application Load Balancer** → 생성:

| 항목 | 값 |
| - | - |
| 이름 | `nns-admin-api-<env>-alb` |
| 체계 | `인터넷 경계` |
| IP 주소 유형 | `IPv4` |
| VPC | 동일 |
| 매핑 | 최소 **2개 AZ** + 각 AZ 의 public subnet |
| 보안 그룹 | **`nx-nest-starter-alb-sg`** (기본 default SG 제거) |
| 리스너 | `HTTP:80` → 기본 작업: `forward to` **`nns-admin-api-<env>-1`** |

생성 후 **DNS 이름 복사**:
```
nns-admin-api-<env>-alb-xxxxxxxxxx.<region>.elb.amazonaws.com
```

#### C. ASG

EC2 → Auto Scaling 그룹 → **`Auto Scaling 그룹 생성`**:

**단계 1 — 시작 템플릿**:
| 항목 | 값 |
| - | - |
| 이름 | `nx-nest-starter-admin-api-<env>-asg` |
| 시작 템플릿 | **`nx-nest-starter-app-lt`** / 버전 `Latest` |

**단계 2 — 인스턴스 시작 옵션**:
- VPC + 서브넷: 최소 2개 AZ public subnet (private subnet 사용 시 NAT GW 필요)

**단계 3 — 고급 옵션**:
| 항목 | 값 |
| - | - |
| 로드 밸런싱 | `기존 로드 밸런서에 연결` |
| 대상 그룹 | **`nns-admin-api-<env>-1`** (1개만) |
| 상태 확인 유형 | **`EC2`** ← 첫 배포 검증 전엔 EC2, 검증 후 ELB 로 변경 |
| 유예 기간 | `300` 초 |

**단계 4 — 그룹 크기**:
| 항목 | 값 |
| - | - |
| 원하는 용량 | `1` (production 은 2 권장) |
| 최소 용량 | `1` |
| 최대 용량 | `2` (Blue/Green 시 일시적 2배) |

**단계 5 — Skip / 단계 6 — 태그**:
- `Name=nx-nest-starter-admin-api-<env>`, `App=admin-api`, `Environment=<env>`

**단계 7 — 검토 + 생성**

#### D. CodeDeploy Application + DG

##### D-1. Application

CodeDeploy → 애플리케이션 → **`애플리케이션 생성`**:
- 이름: `nx-nest-starter-admin-api-<env>`
- 컴퓨팅 플랫폼: `EC2/온프레미스`

##### D-2. DeploymentGroup

만든 애플리케이션 → 배포 그룹 → **`배포 그룹 생성`**:

| 항목 | 값 |
| - | - |
| 이름 | `nx-nest-starter-admin-api-dg-<env>` |
| 서비스 역할 | `nx-nest-starter-codedeploy-service-role` |
| **배포 유형** | **`블루/그린`** |
| 환경 구성 | **`Amazon EC2 Auto Scaling 그룹 자동 복사`** |
| Auto Scaling 그룹 | `nx-nest-starter-admin-api-<env>-asg` |
| 트래픽 재라우팅 | **`즉시 트래픽 다시 라우팅`** |
| 원래 인스턴스 종료 | `5분` (0분은 race 가능, 5분 권장) |
| 배포 구성 | `CodeDeployDefault.AllAtOnce` |
| 로드 밸런서 | **활성** ✅, **Application Load Balancer** |
| 대상 그룹 선택 | **`nns-admin-api-<env>-1`** (1개만 — single-TG 패턴) |

저장.

### 4-3. core-api 인프라

위 admin-api 와 **완전 동일한 패턴**, 이름의 `admin-api` → `core-api` 만 치환.

| 리소스 | 이름 |
| - | - |
| Target Group | `nns-core-api-<env>-1` |
| ALB | `nns-core-api-<env>-alb` |
| ASG | `nx-nest-starter-core-api-<env>-asg` |
| CodeDeploy App | `nx-nest-starter-core-api-<env>` |
| CodeDeploy DG | `nx-nest-starter-core-api-dg-<env>` |

LT 는 동일 (`nx-nest-starter-app-lt`), 포트는 동일 (3000) — 각 instance 별로 독립 컨테이너라 포트 충돌 없음.

### 4-4. batch 인프라

batch 는 ALB 없이 단일 인스턴스 + In-place 배포.

#### A. ASG

EC2 → Auto Scaling 그룹 → 생성:

| 항목 | 값 |
| - | - |
| 이름 | `nx-nest-starter-batch-<env>-asg` |
| 시작 템플릿 | **`nx-nest-starter-batch-lt`** (다른 LT) |
| VPC + 서브넷 | 1~2개 AZ public subnet |
| **로드 밸런싱** | **`연결 안 함`** |
| 상태 확인 유형 | **`EC2`** |
| 유예 기간 | `300` 초 |
| 원하는/최소/최대 | **`1/1/1`** (단일 인스턴스 고정) |
| 태그 | `Name=nx-nest-starter-batch-<env>`, `App=batch`, `Environment=<env>` |

#### B. CodeDeploy Application

CodeDeploy → 애플리케이션 → 생성:
- 이름: `nx-nest-starter-batch-<env>`
- 컴퓨팅 플랫폼: `EC2/온프레미스`

#### C. DeploymentGroup

만든 애플리케이션 → 배포 그룹 → 생성:

| 항목 | 값 |
| - | - |
| 이름 | `nx-nest-starter-batch-dg-<env>` |
| 서비스 역할 | `nx-nest-starter-codedeploy-service-role` |
| **배포 유형** | **`현재 위치`** (In-place) |
| 환경 구성 | `Amazon EC2 Auto Scaling 그룹` → `nx-nest-starter-batch-<env>-asg` |
| 배포 구성 | `CodeDeployDefault.AllAtOnce` |
| **로드 밸런서** | **`로드 밸런싱 활성화` 체크 해제** ✅ |

저장.

---

## 5. GitHub 측 셋업

### 5-1. Repository Variables

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **Variables** 탭 → **Repository variables** 섹션:

| 이름 | 값 |
| - | - |
| `RESOURCE_PREFIX` | `nx-nest-starter` |
| `AWS_REGION` | `ap-northeast-2` (또는 본인 region) |

### 5-2. Environments 생성

GitHub repo → Settings → **Environments** → **New environment** → 두 번 반복:

- `development`
- `production`

각 environment 의 secret/var 등록:

#### Environment Variables (development / production 각각)

| 이름 | 값 (development) | 값 (production) |
| - | - | - |
| `S3_DEPLOY_BUCKET` | `nx-nest-starter-deploy-development` | `nx-nest-starter-deploy-production` |

#### Environment Secrets (development / production 각각)

| 이름 | 값 |
| - | - |
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::<AWS_ACCOUNT_ID>:role/nx-nest-starter-github-actions-deploy-role` (양쪽 동일) |
| `ADMIN_API_ENV_BASE64` | `apps/admin-api/.env.<env>` 의 base64 |
| `CORE_API_ENV_BASE64` | `apps/core-api/.env.<env>` 의 base64 |
| `BATCH_ENV_BASE64` | `apps/batch/.env.<env>` 의 base64 |

#### (선택, production 권장) Protection rules

`production` environment → **`Configure environment`**:
- ✅ **Required reviewers** — production 배포는 사람 승인 필요
- (선택) **Deployment branches** → `Selected branches and tags` → `master` 만 허용

### 5-3. .env 파일 작성 + base64 등록

각 앱의 `.env.<env>` 파일을 로컬에 작성:

```bash
# 각 앱의 .env.example 을 참고해 작성
cp apps/admin-api/.env.example apps/admin-api/.env.development
# 값 채우기 — SERVER_PORT 는 3000 (admin/core) 또는 3001 (batch)
#         — DB connection 은 해당 환경 DB
#         — Lokalise / Firebase / Slack / SES 등 외부 서비스 토큰
```

⚠️ **SERVER_PORT 가 docker-compose port mapping 과 일치해야 함** — admin/core 는 3000, batch 는 3001.

#### base64 인코딩 + GitHub Secret 등록

```bash
pnpm encoding-env-base64
# 1) 앱 선택 (admin-api / core-api / batch)
# 2) 환경 선택 (development / production)
# → 출력된 base64 문자열을 GitHub Environments 의 해당 secret 으로 등록
```

3 앱 × 2 환경 = **6번 반복**.

---

## 6. 첫 배포 검증

development 환경부터 검증.

### 6-1. 배포 트리거

develop 브랜치에 각 앱 영향가는 변경을 push:

```bash
git checkout develop && git pull origin develop

# 3 앱 모두 affected 되도록 workspace-wide 파일 변경
echo "" >> CLAUDE.md  # 빈 줄 한 줄
git add CLAUDE.md
git commit -m "[Chore] CD 첫 배포 트리거"
git push origin develop
```

또는 각 앱별로 README 한 줄 추가 → 해당 앱만 affected.

### 6-2. GitHub Actions 모니터링

`Actions` 탭 → `Pipeline (develop)` workflow:

- **ci** job: lint / test / build / e2e — 통과
- **deploy-admin-api** / **deploy-core-api** / **deploy-batch** jobs: ECR push → CodeDeploy 트리거

### 6-3. AWS 콘솔 모니터링

각 앱의 CodeDeploy:
- 배포 진행 상황 (lifecycle events)
- `Succeeded` 까지 5~10분

### 6-4. 동작 검증

admin-api / core-api:
```bash
curl http://nns-admin-api-development-alb-xxxxxxxxxx.ap-northeast-2.elb.amazonaws.com/v1/health
# → {"status":"ok"} 또는 200 응답
```

batch — SSM Session Manager 접속:
```bash
# EC2 콘솔 → 인스턴스 → batch 인스턴스 선택 → 연결 → Session Manager 탭
sudo -i
docker ps                          # batch 컨테이너 동작 중
docker logs batch | tail           # cron 부팅 로그
curl http://localhost:3001/v1/health   # 200
```

### 6-5. 검증 후 정리

- 각 ASG (admin-api, core-api) 의 **상태 확인 유형 `EC2` → `ELB`** 로 변경 (ALB health check 도 활성)

---

## 7. DB schema 초기화

production 첫 가동 시 DB 가 비어있어 `Table 'xxx' doesn't exist` 에러 가능. 다음 중 하나:

### 옵션 A: development DB 의 schema dump → production DB 로 import

```bash
# dev DB 에서 schema 만 dump (data 제외)
mysqldump -h <dev-db-host> -u <user> -p --no-data --routines --triggers <db-name> > schema.sql

# prod DB 에 적용
mysql -h <prod-db-host> -u <user> -p <db-name> < schema.sql
```

### 옵션 B: TypeORM migration

starter 가 migration 시스템 갖고 있다면:
```bash
NODE_ENV=production pnpm admin migration:run
# (또는 EC2 안에서 docker exec admin-api ...)
```

### 옵션 C: synchronize 임시 활성 (⚠️ 비권장)

production 에서 `synchronize: true` 는 데이터 손실 위험. 진짜 빈 DB 인 경우에만 일회성으로 사용 가능, 적용 후 즉시 비활성화.

---

## 8. 운영 후 권장 작업

development 검증 완료 후:

1. **production 환경 동일 셋업** — 본 가이드의 `<env>=production` 으로 반복
2. **develop → master PR** 만들어 머지 → `pipeline-master.yml` 의 push 트리거로 production CD
3. **production 보안 강화**:
   - ALB 에 ACM 인증서 + HTTPS:443 listener (HTTP:80 redirect)
   - Route 53 도메인 → ALB
   - ALB SG inbound 443 만 (80 제거)
   - production environment 에 required reviewers
   - production ASG min 을 2 이상 (HA)
4. **CloudWatch Logs 설정** — Docker 로그가 EC2 의 `/var/lib/docker/containers/...` 에 쌓이므로 CloudWatch agent 또는 fluent-bit 로 수집 권장
5. **알람** — CloudWatch alarm:
   - ALB 5xx 비율
   - Target Group unhealthy host 수
   - ASG capacity
   - 각 ECS / EC2 의 CPU / Memory
   - Sentry / Slack 으로 알림 연동

---

## 9. 트러블슈팅

CD 단계에서 흔한 문제는 `.claude/docs/CD.md` 의 트러블슈팅 섹션 참고. 본 가이드에서는 셋업 단계의 흔한 실수:

### "Resource not accessible by integration" (nx-set-shas 에서)
workflow permissions 에 `actions: read` 누락 — 이미 starter 의 workflow 에 있음. 본인이 workflow 수정했다면 점검.

### "The deploymentOption value is set to WITH_TRAFFIC_CONTROL, but no load balancer was specified"
CodeDeploy DG 생성 시 LB 활성된 채로 LB/TG 선택 안 함. batch DG 라면 LB 비활성. admin/core DG 라면 TG 선택.

### `Cannot find module '@nestjs/common'` 또는 `'@swc/helpers'` (컨테이너 부팅 시)
Dockerfile 의 `NODE_PATH` 가 정확한지 확인. lib 추가 시 갱신 필수. `add-lib` skill 참고.

### "ScriptFailed at scripts/execute.sh, exit code 1"
컨테이너의 `/v1/health` 가 200 안 받음. SSM 접속해서 `docker logs <container>` 확인. SERVER_PORT 미설정 또는 다른 값일 가능성. `.env.<env>` 의 SERVER_PORT 가 3000 (admin/core) 또는 3001 (batch) 인지.

### AllowTraffic 무한 stuck + CloudTrail 에 ModifyListener 호출 없음
DG 에 TG 2개 등록되어 legacy listener-swap 패턴 trigger 됨. TG 1개로 줄이면 single-TG 패턴 (starter 권장) 으로 정상 동작. `-2` TG 삭제 + DG 편집해 TG 1개만 유지.

### "Table 'xxx' doesn't exist"
production DB 가 빈 상태. 위 "7. DB schema 초기화" 참고.

### CodeDeploy 중지 후 ASG 의 suspended processes 가 그대로
```bash
aws autoscaling resume-processes \
  --auto-scaling-group-name <ASG_NAME> \
  --scaling-processes ScheduledActions AlarmNotification ReplaceUnhealthy InstanceRefresh AddToLoadBalancer AZRebalance
```

---

## 참고 문서

- 아키텍처: `.claude/docs/ARCHITECTURE.md`
- CD 흐름 / 패턴 / 트러블슈팅: `.claude/docs/CD.md`
- 스크립트 / NODE_ENV / .env 매핑: `.claude/docs/SCRIPTS.md`
- 새 app/lib 추가: `add-app` / `add-lib` skill

# 보안 정책 및 API 키 관리

## 개요

이 프로젝트는 민감한 정보(API 키, 토큰 등)를 안전하게 관리하기 위한 여러 보안 조치를 구현하고 있습니다.

## 1. API 키 관리 원칙

### ✅ 올바른 방법
```javascript
// API 키를 환경변수에서 가져오기
const apiKey = process.env.KMA_PUBLIC_DATA_KEY;

if (!apiKey) {
  throw new Error('KMA_PUBLIC_DATA_KEY 환경변수가 필요합니다');
}
```

### ❌ 피해야 할 방법
```javascript
// 하드코딩된 API 키 (절대 금지!)
const apiKey = "abc123def456...";
```

## 2. 환경 변수 설정

### 로컬 개발 환경
1. `.env.example` 파일을 참고하여 `.env.local` 생성
   ```bash
   cp .env.example .env.local
   ```

2. 공공데이터포털에서 API 키 발급
   - https://www.data.go.kr/ (단기예보)
   - https://apihub.kma.go.kr/ (기상청 API 허브)

3. `.env.local`에 키 입력
   ```env
   KMA_PUBLIC_DATA_KEY=your_actual_key_here
   KMA_API_HUB_KEY=your_actual_key_here
   ```

### Vercel 배포
1. Vercel 대시보드의 Project Settings → Environment Variables에서 설정
2. 각 환경별로 상이한 키 사용 권장 (dev, staging, production)

## 3. 자동 보안 검사

### Pre-commit 훅
커밋 전에 자동으로 하드코딩된 시크릿을 검사합니다.

```bash
# 정상 커밋
git commit -m "feat: 새로운 기능"
# 🔍 Checking for hardcoded secrets...
# ✓ Secret check passed

# 시크릿 감지시
# ❌ Potential secrets detected
# 강제 무시 (권장하지 않음):
SKIP_SECRETS_CHECK=1 git commit -m "..."
```

### GitHub Actions
모든 푸시와 PR에서 다음을 검사합니다:
- 하드코딩된 시크릿 (TruffleHog)
- 커밋된 .env 파일 확인
- 환경 변수 문서 검증

## 4. 보안 체크리스트

프로젝트에 새로운 API 통합 시:

- [ ] API 키를 환경변수(`process.env.xxx`)로 읽음
- [ ] 환경변수가 없을 시 명확한 에러 메시지 제공
- [ ] `.env.example`에 템플릿 추가
- [ ] 소스 코드에 실제 키값 없음
- [ ] 배포 환경에서 환경변수 설정 확인

## 5. 이미 노출된 시크릿 대응

만약 실수로 키가 커밋된 경우:

1. **즉시 키 재발급** (매우 중요!)
2. **Git 히스토리에서 제거**
   ```bash
   # 파일 전체 히스토리에서 제거
   git filter-branch --tree-filter 'rm -f filename' HEAD
   git push origin --force-with-lease main
   ```
3. **코드 리뷰 실시**
4. **관련 팀에 공지**

## 6. 자동 스캔 도구

### TruffleHog
- GitHub Actions에서 정규식 패턴으로 시크릿 검사
- Verified matches 우선 감지

### Custom Secret Check Script
- `/scripts/check-secrets.js` - 커밋 전 로컬 검사
- API 키, 토큰, 비밀번호 패턴 감지
- .env 파일이나 process.env는 제외

## 7. 파일 무시 설정

### .gitignore
```
# 환경 설정 파일
.env*
!.env.example

# 기타 민감한 파일
*.pem
*.key
*.private
```

## 참고 자료

- [GitHub - 시크릿 스캐닝](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP - Secrets Management](https://owasp.org/www-community/Sensitive_Data_Exposure)
- [12 Factor App - Config](https://12factor.net/config)
- [TruffleHog - Secret Detection](https://github.com/trufflesecurity/trufflehog)

## 질문 및 문제 보고

보안 관련 이슈 발견 시:
1. GitHub Issues에 보안 문제로 보고하기 (공개하지 않음)
2. 관리자에게 직접 연락
3. 로컬에서 빠르게 수정 후 배포

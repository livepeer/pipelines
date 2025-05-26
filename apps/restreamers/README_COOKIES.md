# YouTube 쿠키 설정 가이드

YouTube에서 "Sign in to confirm you're not a bot" 에러가 발생할 때 쿠키를 사용하여 해결하는 방법입니다.

## 방법 1: 브라우저에서 쿠키 추출

### Chrome/Edge 사용시:

1. Chrome/Edge에서 YouTube에 로그인
2. F12를 눌러 개발자 도구 열기
3. Application/Storage 탭 → Cookies → https://www.youtube.com
4. 다음 쿠키들을 찾아서 복사:
   - `__Secure-1PSID`
   - `__Secure-3PSID`
   - `__Secure-1PAPISID`
   - `__Secure-3PAPISID`
   - `HSID`
   - `SSID`
   - `APISID`
   - `SAPISID`

### 쿠키 파일 생성:

`youtube_cookies.txt` 파일을 다음 형식으로 생성:

```
# Netscape HTTP Cookie File
.youtube.com	TRUE	/	TRUE	0	__Secure-1PSID	[값]
.youtube.com	TRUE	/	TRUE	0	__Secure-3PSID	[값]
.youtube.com	TRUE	/	TRUE	0	__Secure-1PAPISID	[값]
.youtube.com	TRUE	/	TRUE	0	__Secure-3PAPISID	[값]
.youtube.com	TRUE	/	TRUE	0	HSID	[값]
.youtube.com	TRUE	/	TRUE	0	SSID	[값]
.youtube.com	TRUE	/	TRUE	0	APISID	[값]
.youtube.com	TRUE	/	TRUE	0	SAPISID	[값]
```

## 방법 2: 브라우저 확장 프로그램 사용

1. "Get cookies.txt LOCALLY" 확장 프로그램 설치
2. YouTube에 로그인 후 확장 프로그램 실행
3. 생성된 cookies.txt 파일을 `youtube_cookies.txt`로 저장

## 방법 3: yt-dlp 내장 기능 사용

로컬에서 테스트할 때:

```bash
yt-dlp --cookies-from-browser chrome [YouTube URL]
```

## 배포 방법

1. `youtube_cookies.txt` 파일을 `apps/restreamers/` 디렉토리에 저장
2. Docker 빌드 시 자동으로 포함됨
3. 또는 Fly.io 볼륨을 사용하여 런타임에 마운트

## 주의사항

- 쿠키는 주기적으로 만료되므로 정기적인 업데이트 필요
- 보안상 쿠키 파일을 Git에 커밋하지 마세요
- `.gitignore`에 `youtube_cookies.txt` 추가 권장

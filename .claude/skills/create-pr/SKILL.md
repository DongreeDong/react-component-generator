---
name: create-pr
description: 현재 브랜치의 커밋들을 분석해 PR 제목과 본문을 만들고, GitHub PR을 생성한다. "PR 만들어줘", "PR 올려줘", "풀리퀘 생성", "create pr", "pull request 열어줘"처럼 작업을 PR로 올리려는 요청이면 반드시 이 스킬을 사용한다. 프로젝트 언어에 따라 영문 또는 한국어 템플릿을 고른다. 독립된 서브 에이전트(fork)에서 실행된다.
context: fork
allowed-tools:
  - Bash(git status*)
  - Bash(git branch*)
  - Bash(git log*)
  - Bash(git diff*)
  - Bash(git rev-parse*)
  - Bash(git push*)
  - Bash(git checkout -b*)
  - Bash(git switch -c*)
  - Bash(gh repo view*)
  - Bash(gh pr list*)
  - Bash(gh pr create*)
  - Bash(gh pr view*)
  - Read
  - Glob
  - Grep
---

# PR 생성 스킬

이 스킬은 fork된 서브 에이전트에서 실행된다. 부모 대화의 맥락은 보이지 않으므로, 필요한 정보는 모두 git과 GitHub에서 직접 얻는다. 마지막에는 생성된 PR의 URL만 짧게 돌려준다.

## 절차

### 1. 상태 확인

- `git rev-parse --is-inside-work-tree`로 저장소인지 확인한다. 아니면 중단하고 알린다.
- `git status --short`로 커밋되지 않은 변경을 확인한다. 변경이 남아 있으면 PR에 들어가지 않으므로, 먼저 커밋해야 한다는 사실을 알리고 중단한다. 커밋은 이 스킬의 일이 아니다.
- `git branch --show-current`로 현재 브랜치를 확인한다.

### 2. 기본 브랜치와 대상 확인

- `gh repo view --json defaultBranchRef,nameWithOwner`로 기본 브랜치(보통 `main`)를 얻는다.
- 현재 브랜치가 기본 브랜치라면 **기본 브랜치에서 PR을 만들지 않는다.** 작업 내용을 바탕으로 `feat/...`, `fix/...`처럼 새 브랜치를 만들고 옮긴다(`git switch -c`). 이때 커밋은 그대로 따라간다.

### 3. 변경 분석

- `git log <기본 브랜치>..HEAD --oneline`으로 PR에 들어갈 커밋 목록을 얻는다.
- `git diff <기본 브랜치>...HEAD --stat`과 필요한 부분의 `git diff`로 실제 변경 내용을 읽는다.
- 커밋 메시지만 보고 쓰지 않는다. 커밋 메시지가 빠뜨린 변경(테스트 추가, 설정 변경 등)을 diff에서 확인한다.

### 4. 템플릿 언어 결정

템플릿은 `references/` 폴더에 있다.

- 영문: `references/pr-template-en.md`
- 한국어: `references/pr-template-ko.md`

다음 순서로 판단하고, 첫 번째로 결정되는 것을 쓴다.

1. **사용자의 명시적 지정.** 요청에 "영문으로", "English", "한국어로" 같은 표현이 있으면 그대로 따른다.
2. **프로젝트 신호.** 다음 중 여러 개가 같은 방향이면 그 언어로 결정한다.
   - `README.md`, `CONTRIBUTING.md`의 언어
   - `gh pr list --state all --limit 10`으로 본 기존 PR 제목·본문의 언어
   - 저장소가 외부 기여를 받는 공개 오픈소스인지 여부 (`gh repo view`의 visibility와 소유자)
3. **위 신호가 없거나 엇갈리면 한국어 템플릿**을 쓴다. 이 프로젝트는 기본적으로 한국 팀 프로젝트로 본다.

결정한 언어와 근거를 최종 보고에 한 줄로 남긴다.

### 5. 제목과 본문 작성

- **제목**은 템플릿 언어로 쓴다. 형식은 커밋 컨벤션과 같다.
  - 한국어: `feat: 프롬프트 500자 제한 추가`
  - 영문: `feat: add 500-character prompt limit`
  - 종류는 `feat`, `fix`, `refactor`, `chore`, `docs`, `test` 중에서 고른다. 여러 종류가 섞이면 PR의 주된 목적을 따른다.
- **본문**은 `references/` 템플릿의 섹션 순서와 제목을 그대로 따른다. 섹션을 빼거나 순서를 바꾸지 않는다. 해당 내용이 없는 섹션은 "해당 없음"으로 적는다.
- 변경 사항은 커밋 목록이 아니라 **무엇이 달라졌는지**를 기준으로 쓴다. 파일 이름을 나열하기보다 동작 변화를 설명한다.
- 테스트 항목에는 실제로 실행한 명령과 결과만 적는다. 실행하지 않은 검증을 통과한 것처럼 쓰지 않는다.
- 본문 맨 끝에는 빈 줄을 두고 다음 줄을 붙인다. 템플릿 언어와 무관하게 이 줄은 그대로 쓴다.

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 6. 푸시와 PR 생성

1. 브랜치를 원격에 올린다: `git push -u origin <브랜치>`. **`--force`는 쓰지 않는다.**
2. 제목과 본문을 파일로 쓰고(본문은 HEREDOC 또는 임시 파일), 다음으로 PR을 만든다.

```bash
gh pr create --base <기본 브랜치> --head <브랜치> --title "<제목>" --body-file <본문 파일>
```

3. 같은 브랜치에 이미 열린 PR이 있는지 `gh pr list --head <브랜치>`로 먼저 확인한다. 있으면 새로 만들지 말고 그 PR의 URL을 보고한다.

### 7. 결과 보고

생성된 PR의 URL, 제목, 사용한 템플릿 언어와 그 근거를 짧게 돌려준다. 실패했다면 실패한 명령과 에러 메시지를 그대로 보여준다.

## 하지 않는 것

- 기본 브랜치에 직접 PR을 만들거나 기본 브랜치로 푸시하지 않는다.
- `git push --force`, `git reset --hard`를 쓰지 않는다.
- 커밋되지 않은 변경을 임의로 커밋하거나 `git add -A`로 올리지 않는다.
- 실행하지 않은 테스트 결과를 적지 않는다.
- PR을 머지하지 않는다. 리뷰어 지정과 머지는 사용자가 한다.

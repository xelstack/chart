# Prettier Config 파일 형식

## 발견

Prettier는 JSON, JavaScript ESM, JavaScript CommonJS, TypeScript, YAML, TOML config file을 지원한다.

이 repository에서는 root `package.json`이 `"type": "module"`을 사용하므로 `prettier.config.js`가 초기 선택으로 가장 적합하다.

## 근거

- Prettier 공식 문서는 `prettier.config.js`와 `prettier.config.cjs`를 지원 config file name으로 나열한다.
- Prettier 공식 문서는 `.js` config가 `package.json`의 `type` 값에 따라 `export default` 또는 `module.exports`를 사용한다고 설명한다.
- TanStack Query는 root `"type": "module"`과 `export default`를 쓰는 `prettier.config.js`를 사용한다.
- Vue Core는 `.prettierrc`를 사용한다.
- Rollup은 `.prettierrc.json`을 사용한다.

## 결정

다음을 사용한다.

```text
prettier.config.js
```

내용은 다음과 같다.

```js
/** @type {import("prettier").Config} */
const config = {
  semi: true,
  tabWidth: 2,
  useTabs: false,
};

export default config;
```

미래의 tool이 CommonJS config loading을 요구하지 않는 한 `prettier.config.cjs`는 사용하지 않는다.

## 다시 볼 시점

- Prettier config에 CommonJS-only plugin loading이 필요해질 때.
- root package가 `"type": "module"`을 더 이상 사용하지 않을 때.
- tooling이 ESM Prettier config를 load하지 못할 때.

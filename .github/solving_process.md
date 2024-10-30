# 🧐 memegle 프로젝트 성능 개선하기 풀이

[우아한테크코스](https://github.com/woowacourse) 프론트 성능 베이스 캠프 문제 중 [memegle 프로젝트 성능 개선하기](https://github.com/woowacourse/perf-basecamp) 풀이 기록하기.

풀이 과정은 주어진 요구사항을 하나씩 풀어가면서 webpack 공식 사이트에서 소개하는 [analyze tool](https://webpack.github.io/analyse/)을 이용하여 성능이 얼마나 개선되었는지 확인하는 방식으로 진행.

AWS의 S3, CloudFront 서비스를 활용하는 요구사항을 제외하고 최대한 풀어 볼 예정.

## 0. 준비

```json
// package.json

{
  "author": "jaehyeonjung0613",
  "homepage": "https://jaehyeonjung0613.github.io/perf-basecamp"
}
```

forked github repository에 맞춰 author, homepage 수정.

```json
// package.json

{
  "scripts": {
    "build:dev": "webpack --mode=development --profile --json > stat_0.json"
  }
}
```

```bash
npm run build:dev
```

analyze 분석자료 출력을 위해 build script 수정 및 스크립트 수행.

```js
// webpack.config.js

module.exports = {
  output: {
    publicPath: '/'
  },
  devServer: {
    openPage: ['perf-basecamp']
  }
};
```

페이지 번들 리소스 절대경로 설정.(Search 페이지 새로고침 시 리소스 못 불러오는 현상 조치)

dev server 기본 페이지 설정.(url 수정 귀찮...)

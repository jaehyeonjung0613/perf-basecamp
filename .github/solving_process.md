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

## 1. css/js minify, uglify

```js
// webpack.config.js

module.exports = {
  optimization: {
    minimize: true
  }
};
```

webpack은 기본으로 js의 minify, uglify minimizer(TerserWebpackPlugin)가 있기 때문에 minimize만 설정.(production 환경에선 기본으로 true)

```bash
npm i -D mini-css-extract-plugin css-minimizer-webpack-plugin
```

```js
// webpack.config.js

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  optimization: {
    minimizer: [`...`, new CssMinimizerPlugin()]
  }
};
```

MiniCssExtractPlugin으로 inner css 적용되어있던 부분을 chunk 단위로 번들링되도록 설정.

CssMinimizerPlugin으로 css 최소화 적용.

```json
// package.json

{
  "scripts": {
    "build:dev": "webpack --mode=development --profile --json > stat_1.json"
  }
}
```

```bash
npm run build:dev
```

| stat\_`{풀이버전}` |                                                         assets size                                                          |
| :----------------: | :--------------------------------------------------------------------------------------------------------------------------: |
|       stat_0       | <img alt="stat_0_profile" width=1280 src="https://github.com/user-attachments/assets/696e4cbd-f29f-4f53-8b06-129f409cd9b1"/> |
|       stat_1       | <img alt="stat_0_profile" width=1280 src="https://github.com/user-attachments/assets/0ea30922-ea80-4922-9e3e-ba632a6e3a94"/> |

bundle 크기가 절반 정도 감소됨.

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

## 2. gzip

```js
// webpack.config.js

module.exports = {
  devServer: {
    compress: true
  }
};
```

webpack dev server에 gzip 기능을 부여하기 위한 설정.

```bash
npm i -D compression-webpack-plugin
```

```js
// webpack.config.js

const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  plugins: [
    new CompressionPlugin({
      test: /\.*(\?.*)?$/i
    })
  ]
};
```

```json
// package.json

{
  "scripts": {
    "build:dev": "webpack --mode=development --profile --json > stat_2.json"
  }
}
```

```bash
npm run build:dev
```

결과를 확인하기 전에 CompressionPlugin(정적 리소스를 gzip으로 압축해주는 플러그인)을 사용하여 실제 서버에서 gzip 일어났을 때 압축된 파일을 미리 확인.

<img alt="gziped_bundle" width=300 src="https://github.com/user-attachments/assets/adde08c4-bf1b-4a34-9496-c3bfce101fb1">

압축된 번들 리소스가 생성되고 크기가 감소됨.

| stat\_`{풀이버전}` |   Name    | Status |  Type  |    Initiator     |  Size  | Time  |
| :----------------: | :-------: | :----: | :----: | :--------------: | :----: | :---: |
|       stat_1       | bundle.js |  200   | script | perf-basecamp:14 | 1.2 MB | 23 ms |
|       stat_2       | bundle.js |  200   | script | perf-basecamp:14 | 335 kB | 75 ms |

동일한 환경(pc, network, browser, disable cache)에서 브라우저 devTool Network로 비교해봤을 때 번들 크기가 3배 정도 감소(대신 server gzip, client ungzip 과정 때문에 time은 증가).

사실 해당 설정은 webpack 기능이라기 보단 web server 설정에 가깝.

해당 테스트는 webpack dev server로 비교했지만 실제 배포할땐 배포 서버 설정에 따라 기능 제공여부가 달라짐.

다행이 github pages service는 gzip 기능을 제공함.

## 3. image optimization - image format, compression

```bash
npm i -D image-minimizer-webpack-plugin sharp
```

wepback 공식 사이트에서 소개하는 [이미지 최적화 플러그인](https://webpack.js.org/plugins/image-minimizer-webpack-plugin/#optimize-images-based-on-size) 설치

최적화를 수행하기 위해선 라이브러리 설치가 필요한데, 총 3가지를 지원함(1개 더 있지만, deprecated 됨)

svg 파일 형식만 지원하는 `svgo`를 제외한 `imagemin`, `sharp`라이브러리 중 하나를 선택

풀이에선 별도의 모듈을 설치하는 것이 번거로워 `sharp`를 선택

```js
// webpack.config.js

const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

module.exports = {
  module: {
    rules: [
      // {
      //   test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
      //   loader: 'file-loader',
      //   options: {
      //     name: 'static/[name].[ext]'
      //   }
      // }
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
        generator: {
          filename: 'static/[name][ext]'
        }
      }
    ]
  },
  optimization: {
    minimizer: [
      new ImageMinimizerPlugin({
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg)$/i,
        generator: [
          {
            preset: 'webp',
            implementation: ImageMinimizerPlugin.sharpGenerate,
            options: {
              encodeOptions: {
                webp: {}
              }
            }
          }
        ]
      })
    ]
  }
};
```

`ImageMinimizerPlugin`에서 최적화 결과물 위치를 지정해주기 위해 file-loader 대신 내장 asset 모듈 사용

preset을 사용하여 webp 확장자로 geneator할 파일의 식별자 지정(꼭 webp로 할 필요 없음)

generate할 파일 확장자를 encodeOptions.확장자 방식으로 설정(확장자마다 자세한 최적화 옵션은 [여기](https://sharp.pixelplumbing.com/api-output#jpeg) 참조)

```tsx
// Home.tsx

// import heroImage from '../../assets/images/hero.png';
const heroImage = new URL('../../assets/images/hero.png?as=webp&w=1280&h=auto', import.meta.url);
```

대상 파일 호출 경로에 식별자와 이미지 크기를 줄이기 위한 resize 설정을 query parameter에 지정

```json
// package.json

{
  "scripts": {
    "build:dev": "webpack --mode=development --profile --json > stat_3.json"
  }
}
```

```bash
npm run build:dev
```

| stat\_`{풀이버전}` |                                                         assets size                                                          |
| :----------------: | :--------------------------------------------------------------------------------------------------------------------------: |
|       stat_2       | <img alt="stat_2_profile" width=1280 src="https://github.com/user-attachments/assets/ad1df2a0-665a-4d4f-9b1a-97e045788efa"/> |
|       stat_3       | <img alt="stat_3_profile" width=1280 src="https://github.com/user-attachments/assets/a2806915-0eaf-474d-ae07-3e11b86101f6"/> |

bundle 크기가 10MB → 117KB 감소됨.

## 4. Code Splitting

### Home 페이지에서 불러오는 스크립트 리소스에 Search 페이지의 소스 코드가 포함되지 않아야 한다.

```typescript
// App.tsx

// import Home from './pages/Home/Home';
// import Search from './pages/Search/Search';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home/Home'));
const Search = lazy(() => import('./pages/Search/Search'));

const App = () => {
  return (
    <Router basename={'/perf-basecamp'}>
      <NavBar />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Suspense>
      <Footer />
    </Router>
  );
};
```

필요 페이지 리소스만 불러오기 위해 각 페이지 컴포넌트 import 방식을 동적으로 변경.

```json
// package.json

{
  "scripts": {
    "build:dev": "webpack --mode=development --profile --json > stat_4.json"
  }
}
```

```bash
npm run build:dev
```

| stat\_`{풀이버전}` |                                                         chunks size                                                          |
| :----------------: | :--------------------------------------------------------------------------------------------------------------------------: |
|       stat_3       | <img alt="stat_3_profile" width=1280 src="https://github.com/user-attachments/assets/668e404b-e5e7-47b0-9d4d-595cebfedd52"/> |
|       stat_4       | <img alt="stat_4_profile" width=1280 src="https://github.com/user-attachments/assets/fe234e45-3448-4ac3-82f3-b0ebc0677deb"/> |

페이지 컴포넌트별 청크단위로 분리됨.

### react-icons 패키지에서 실제로 사용하는 아이콘 리소스만 빌드 결과에 포함되어야 한다.

```bash
npm run serve
```

<img alt="result_4_1" src="https://github.com/user-attachments/assets/50828d17-4a51-4f91-b7dd-899e4e61cb1e"/>

Search 페이지 리소스에서 사용하고 있는 `AiOutlineInfo, AiOutlineClosf, AiOutlineSearch` 아이콘 외에도 불필요한 아이콘을 불러오고 있음.

```json
// package.json

{
  "sideEffects": ["*.css"]
}
```

렌더링 이후 동적 스타일 적용을위해 css 파일을 제외하고 그 외 소스파일을 sideEffects로 지정.

```js
// webpack.config.js

module.exports = {
  optimization: {
    sideEffects: true,
    usedExports: true
  }
};
```

package.json의 sideEffects를 적용하기 위해 sideEffects 옵션을 true로 설정.

번들시 export될 모듈을 결정하기 위해 usedExports 옵션을 true로 설정.(production 환경에선 기본으로 true)

```bash
npm run serve
```

<img alt="result_4_2" src="https://github.com/user-attachments/assets/3b4c1bc2-0db9-4bf4-921c-2539148672ff"/>

불필요한 아이콘이 사라짐.

```bash
npm run build:dev
```

| stat\_`{풀이버전}` |                                                         assets size                                                          |
| :----------------: | :--------------------------------------------------------------------------------------------------------------------------: |
|       stat_3       | <img alt="stat_3_profile" width=1280 src="https://github.com/user-attachments/assets/a2806915-0eaf-474d-ae07-3e11b86101f6"/> |
|       stat_4       | <img alt="stat_4_profile" width=1280 src="https://github.com/user-attachments/assets/629f3e4d-a01e-448b-a722-078824657d01"/> |

페이지 컴포넌트별 청크단위로 분리되어 청크 크기가 줄어든것이 한눈에 안보임.

그래도 계산해보자면, 976kb > 331kb + 4kb + 16kb + 13kb + 5kb로.

607kb 절약됨.

## 5. React Profiler

```tsx
//    GiftItem.tsx

const GifItem = ({ imageUrl = '', title = '' }: GifItemProps) => {
  return (
    <Profiler
      id="GiftItemProfiler"
      onRender={(id, phase, actualTime, baseTime, startTime, commitTime) =>
        console.table({ id, phase, actualTime, baseTime, startTime, commitTime })
      }
    >
      <div className={styles.gifItem}>
        <img className={styles.gifImage} src={imageUrl} />
        <div className={styles.gifTitleContainer}>
          <div className={styles.gifTitleBg}></div>
          <h4 className={styles.gifTitle}>{title}</h4>
        </div>
      </div>
    </Profiler>
  );
};
```

<img alt="react_developer_tools_01" src="https://github.com/user-attachments/assets/38ede6df-ae5d-44af-8444-5033c2366b6e"/>

[react_developer_tools](https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) 크롬 확장프로그램 설치.

<img alt="react_developer_tools_02" src="https://github.com/user-attachments/assets/bc41eada-dbb9-4e67-80d2-07a4877e2f84"/>

DevTools > Profile 탭에서 옵션버튼 클릭.

렌더링된(Mount or Update) 컴포넌트를 표시하기 위한 설정 체크.

<img alt="result_5_1" src="https://github.com/user-attachments/assets/65fd1e51-fe72-4c17-9a5c-5bfbb2da50fd"/>

<br />

<img alt="result_5_2" src="https://github.com/user-attachments/assets/418bfbcd-2254-4cf2-b397-8914bdf7c101"/>

브라우저 DevTool 열어둔 상태에서 Search 페이지에서 load more 클릭.

이전 GiftItem 컴포넌트도 재렌더링됨.

```tsx
// GiftItem.tsx

import { memo, Profiler } from 'react';

export default memo(GifItem);
```

GiftItem 컴포넌트 메모제이션(Memoization) 설정.

<img alt="result_5_4" src="https://github.com/user-attachments/assets/827ab16e-a4ed-4b5f-9e98-4e5d898c0c71"/>

<br />

<img alt="result_5_5" src="https://github.com/user-attachments/assets/e181f16a-b792-4a8b-a421-66b0cb6d332b"/>

추가 로드시 이전 GiftItem 컴포넌트가 재렌더링에서 제외됨.

```json
// package.json

{
  "scripts": {
    "build:dev": "webpack --mode=development --profile --json > stat_5.json"
  }
}
```

```bash
npm run build:dev
```

| stat\_`{풀이버전}` |                                                       assets size                                                        |
| :----------------: | :----------------------------------------------------------------------------------------------------------------------: |
|       stat_4       | <img alt="result_5_3" width=1280 src="https://github.com/user-attachments/assets/fec44d3f-c6aa-4df7-b2a2-92bdc4bbfef9"/> |
|       stat_5       | <img alt="result_5_6" width=1280 src="https://github.com/user-attachments/assets/021a4941-f1b3-409f-b056-ef8080fba898"/> |

이전과 비교했을때 메모제이션(Memoization)으로 인해 회색부분(렌더링 x)으로 변함.

## 6. CSS triggers

### 6-1. Layout Shift 없이 애니메이션이 일어나야 한다.

DevTools > Performance에서 Chrome CPU 6x slowdown Network Slow 4G로 성능 측정.

페이지별 Layout shift 현상은 다음과 같다.

**-- Home --**

<img alt="result_6_1_1" src="https://github.com/user-attachments/assets/2bcda23a-5d15-4435-81bc-fef002173f90"/>

동적으로 삽입된 콘텐츠(footer 이동)

<img alt="result_6_1_2" src="https://github.com/user-attachments/assets/37f52950-f450-405e-9c21-2c8ac5daf4ea"/>

FOIT / FOUT를 유발하는 웹 글꼴

**-- Search --**

<img alt="result_6_1_3" src="https://github.com/user-attachments/assets/d9f1aba2-1276-4a3b-86d0-3a6309c6c1d1"/>

FOIT / FOUT를 유발하는 웹 글꼴

<img alt="result_6_1_4" src="https://github.com/user-attachments/assets/cd8ab549-bbb4-44f1-9e35-e46b0e6e668c"/>

동적으로 삽입된 콘텐츠(footer 이동)

<img alt="result_6_1_5" src="https://github.com/user-attachments/assets/5b558d23-b884-4659-8f0b-c71437e62033"/>

동적으로 삽입된 콘텐츠(section 크기변경)

---

```plaintext
[공통] - 동적으로 삽입된 콘텐츠(footer 이동)
[공통] - FOIT / FOUT를 유발하는 웹 글꼴
[search] - 동적으로 삽입된 콘텐츠(section 크기변경)
```

총 3가지의 유형의 Layout shift 발생.

```tsx
// App.tsx

const App = () => {
  return (
    <Router basename={'/perf-basecamp'}>
      <NavBar />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
        </Routes>
        <Footer />
      </Suspense>
    </Router>
  );
};
```

동적 페이지와 함께 footer 컴포넌트가 로드되도록 수정.

```html
<!-- index.html -->

<link
  href="https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,400;0,700;1,400;1,700&display=block"
  rel="stylesheet"
/>
```

font display swap으로 인한 FOIT / FOUT 방지.

```css
/* SearchResult.module.css */

/* 해상도 480px ~ 767px*/
@media all and (max-width: 767px) {
  .searchResultSection {
    width: 480px;
  }
}

/* 해상도 768px ~ 1023px */
@media all and (min-width: 768px) and (max-width: 1023px) {
  .searchResultSection {
    width: 768px;
  }
}

/* 해상도 1024px ~ 1180px */
@media all and (min-width: 1024ppx) and (max-width: 1279px) {
  .searchResultSection {
    width: 1024px;
  }
}

/* 해상도 1280px */
@media all and (min-width: 1280px) {
  .searchResultSection {
    width: 1180px;
  }
}

.searchResultSection {
  min-height: 90vh;
  min-width: 480px;
  max-width: 1180px;
  margin: 0 auto;
}
```

section 크기변경은 반응형 디바이스 별 해상도 분기점을 지정하여 크기가 고정되도록 설정.

**-- Home --**

<img alt="result_6_1_6" src="https://github.com/user-attachments/assets/336df172-a677-4888-a178-bc0a24dccbf4"/>

**-- Search --**

<img alt="result_6_1_7" src="https://github.com/user-attachments/assets/f2427dcf-6e4a-40e8-814b-1cd09b3ca07a"/>

---

Layout Shfit 사라짐.

### 6-2. Frame Drop이 일어나지 않아야 한다.

<img alt="result_6_2_1" src="https://github.com/user-attachments/assets/3fe0f27b-5dbb-49cd-a373-75d813d3add8"/>

Home 페이지에서 hero 이미지를 로드하는 과정에서 Partially Presented Frame 발생.

```tsx
// Home.tsx

const heroImage = new URL('../../assets/images/hero.png?as=webp&w=1024&h=auto', import.meta.url);

const Home = () => {
  const wrapperRef = useRef<HTMLElement>(null);

  return (
    <>
      <section className={styles.heroSection}>
        <img
          className={styles.heroImage}
          src={heroImage.href}
          alt="hero image"
          fetchpriority="high"
        />
      </section>
    </>
  );
};
```

```ts
// images.d.ts

declare module React {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}
```

이미지 크기를 1280 → 1024로 줄여 로드 속도 개선.

hero 로드 우선순위를 높게 지정하여, 처리가 지연되지 않도록 fetchpriority 설정.

React에서 제공하는 fetchPriority 설정이 있긴 하지만, 현재 사용하면 warning 경고가 발생하기 때문에 커스텀 속성 사용.(React 19에 고쳐진다는 얘기가...)

<img alt="result_6_2_2" src="https://github.com/user-attachments/assets/cc0c3055-1ca7-41ed-8422-8fbca9312b45"/>

Partially Presented Frame 사라짐.

```json
// package.json

{
  "scripts": {
    "build:dev": "webpack --mode=development --profile --json > stat_6.json"
  }
}
```

```bash
npm run build:dev
```

| stat\_`{풀이버전}` |                                                         assets size                                                          |
| :----------------: | :--------------------------------------------------------------------------------------------------------------------------: |
|       stat_5       | <img alt="stat_5_profile" width=1280 src="https://github.com/user-attachments/assets/b69ef0c7-18a9-4955-a4b2-48184f336d53"/> |
|       stat_6       | <img alt="stat_6_profile" width=1280 src="https://github.com/user-attachments/assets/f7ea9370-4c66-41e0-a9f0-552c705a1a65"/> |

이미지 117kb → 82kb로 감소.

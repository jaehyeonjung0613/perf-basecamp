import { memo, Profiler } from 'react';
import { GifImageModel } from '../../../../models/image/gifImage';

import styles from './GifItem.module.css';

type GifItemProps = Omit<GifImageModel, 'id'>;

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

export default memo(GifItem);

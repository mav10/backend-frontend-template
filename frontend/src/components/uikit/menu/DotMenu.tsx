import React, { useRef, useState } from 'react';
import { AppMenu, AppMenuProps } from './AppMenu';
import styles from './DotMenu.module.scss';
import Dots from 'assets/icons/dots.svg?react';

export type DotMenuProps = Omit<AppMenuProps, 'anchorEl' | 'open'> & {
  size?: 'small' | 'medium';
  testId?: string;
};

export const DotMenu: React.FC<DotMenuProps> = React.memo(
  function DotMenu(props) {
    const menuAnchorRef = useRef<HTMLElement>(null);
    const [isMenuShown, setIsMenuShown] = useState(false);

    const coeff = props.size === 'medium' ? 1.5 : 1;
    const style = { width: 4 * coeff, height: 12 * coeff };
    return (
      <div>
        <div
          ref={menuAnchorRef as any}
          className={styles.dotMenu}
          onClick={() => {
            setIsMenuShown(true);
          }}
        >
          <Dots
            className={styles.dotMenuImage}
            {...style}
            data-test-id={props.testId}
          />
        </div>
        <AppMenu
          {...props}
          anchorEl={menuAnchorRef.current}
          open={isMenuShown}
          onClose={() => {
            setIsMenuShown(false);
          }}
        />
      </div>
    );
  },
);

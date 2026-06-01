import type {ReactNode} from 'react';
import {Fragment} from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
import NavbarItem from '@theme/NavbarItem';

type NavbarConfigItem = {
  label?: string;
  items?: NavbarConfigItem[];
  [key: string]: unknown;
};

function SectionHeading({label}: {label: string}): ReactNode {
  return (
    <li className="menu__list-item">
      <span className="menu__link" style={{opacity: 0.75, fontWeight: 700}}>
        {label}
      </span>
    </li>
  );
}

function PrimaryMenuItem({
  item,
  onLeafClick,
}: {
  item: NavbarConfigItem;
  onLeafClick: () => void;
}): ReactNode {
  if (item.items?.length) {
    return (
      <Fragment>
        <SectionHeading label={item.label ?? 'Section'} />
        {item.items.map((childItem, index) => (
          <NavbarItem
            mobile
            isDropdownItem
            onClick={onLeafClick}
            activeClassName="menu__link--active"
            {...childItem}
            key={`${item.label ?? 'section'}-${index}`}
          />
        ))}
      </Fragment>
    );
  }

  return (
    <NavbarItem
      mobile
      onClick={onLeafClick}
      activeClassName="menu__link--active"
      {...item}
    />
  );
}

export default function NavbarMobilePrimaryMenu(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  const items = useThemeConfig().navbar.items as NavbarConfigItem[];

  return (
    <ul className="menu__list">
      {items.map((item, index) => (
        <PrimaryMenuItem
          item={item}
          onLeafClick={() => mobileSidebar.toggle()}
          key={`${item.label ?? 'item'}-${index}`}
        />
      ))}
    </ul>
  );
}

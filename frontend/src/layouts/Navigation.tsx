import React from 'react';
import { Sidebar, SidebarProps, ROLE_NAVIGATION_MAP } from './Sidebar';

export const Navigation: React.FC<SidebarProps> = (props) => {
  return <Sidebar {...props} />;
};

export { ROLE_NAVIGATION_MAP };
export default Navigation;

import oscLogo from './assets/osc-logo-gray.png'
import { NavLink } from 'react-router-dom';

// https://codepen.io/robstinson/pen/bGwpNMV

export default function SideNav() {

  const linkGroups = [
    {
      name: 'Main',
      links: [
        { name: 'Documents', link: '/documents', icon: 'icon-archive' },
        { name: 'Projects', link: '/projects', icon: 'icon-briefcase' },
      ]
    }
  ];

  return (
    <div className="fixed top-0 left-0 flex flex-col items-center w-16 h-full overflow-hidden text-gray-700 bg-gray-100 rounded">
      <a className="flex items-center justify-center mt-3" href="#">
        <img src={oscLogo} className="w-6 h-6"/>
      </a>
      { linkGroups.map((linkGroup) => (
          <div className="flex flex-col items-center mt-3 border-t border-gray-300" key={ linkGroup.name }>
          { linkGroup.links.map((link) => (
            <NavLink to={ link.link } key={ link.link }
                className={({ isActive }) => {
                return 'flex items-center justify-center w-12 h-12 mt-2 rounded ' + (isActive?'bg-white':'hover:bg-gray-200');
              }}>
              <i className={`${ link.icon } text-teal-500 text-xl`}/>
            </NavLink>
          )) }
          </div>
      )) }
    </div>
  )
}

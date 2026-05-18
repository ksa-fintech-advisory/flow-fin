/** Panel open/close icons (Lucide PanelRightOpen / PanelRightClose style). */
export function SidebarPanelIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      className="ff-sidebar__toggle-svg"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M15 3v18" />
      {collapsed ? <path d="m10 9 3 3-3 3" /> : <path d="m10 15-3-3 3-3" />}
    </svg>
  )
}

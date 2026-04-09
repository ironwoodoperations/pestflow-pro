import { useHolidayMode } from "./hooks/useHolidayMode";

interface HolidayWrapperProps {
  children: React.ReactNode;
}

const HolidayVideoWrapper = ({ children }: HolidayWrapperProps) => {
  const { enabled, activeTheme } = useHolidayMode();

  if (!enabled || !activeTheme) {
    return <>{children}</>;
  }

  return (
    <div className="relative" style={{ border: `2px solid ${activeTheme.borderColor}`, borderRadius: "12px", overflow: "visible" }}>
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "-1px",
          background: activeTheme.borderColor,
          color: activeTheme.ribbonText,
          fontFamily: '"Open Sans", sans-serif',
          fontSize: "11px",
          fontWeight: 600,
          padding: "3px 10px 3px 8px",
          borderRadius: "4px 0 0 4px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          zIndex: 10,
          lineHeight: 1.4,
        }}
      >
        <span style={{ fontSize: "13px" }}>{activeTheme.emoji}</span>
        {activeTheme.name}
      </div>
      {children}
    </div>
  );
};

export default HolidayVideoWrapper;

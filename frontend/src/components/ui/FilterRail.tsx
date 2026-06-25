import { Calendar } from 'lucide-react';
import { useKpiStore, useDeptStore, departments } from '../../lib/store';

interface FilterRailProps {
  className?: string;
}

export function FilterRail({ className }: FilterRailProps) {
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);
  const periods = useKpiStore((s) => s.periods);
  const setCurrentPeriod = useKpiStore((s) => s.setCurrentPeriod);
  const selectedDeptId = useDeptStore((s) => s.selectedDeptId);
  const setDept = useDeptStore((s) => s.setDept);
  const dept = useDeptStore((s) => s.getSelectedDept());

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }} className={className}>
      {/* Period Picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', flexShrink: 0 }}>
          <Calendar size={16} />
        </div>
        <select
          id="period-filter"
          value={currentPeriodId}
          onChange={(e) => setCurrentPeriod(e.target.value)}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#334155',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '8px',
            padding: '7px 14px',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
          onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
          aria-label="Select period"
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Department Picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: dept.color,
          flexShrink: 0,
          boxShadow: `0 0 0 3px ${dept.color}22`,
        }} />
        <select
          id="department-filter"
          value={selectedDeptId}
          onChange={(e) => setDept(e.target.value)}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#334155',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '8px',
            padding: '7px 14px',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            maxWidth: '280px',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.target.style.borderColor = dept.color; }}
          onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
          aria-label="Select department"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

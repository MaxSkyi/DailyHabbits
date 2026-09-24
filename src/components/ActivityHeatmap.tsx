import React, { useState, useMemo } from 'react';
import { Activity, Calendar } from 'lucide-react';
import { HeatmapCell } from '../lib/types';
import { buildHeatmapGrid } from '../lib/dateUtils';
import { formatDateUkrainian } from '../lib/i18n';

interface ActivityHeatmapProps {
  logsByDate: Record<string, number>;
  totalActiveHabits: number;
  logicalTodayStr: string;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  logsByDate,
  totalActiveHabits,
  logicalTodayStr,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    cell: HeatmapCell;
    x: number;
    y: number;
  } | null>(null);

  const { grid, monthLabels } = useMemo(() => {
    return buildHeatmapGrid(logsByDate, totalActiveHabits, logicalTodayStr);
  }, [logsByDate, totalActiveHabits, logicalTodayStr]);

  // Color mapper matching dark/light mode
  const getCellBg = (level: number) => {
    switch (level) {
      case 1:
        return '#0E4429';
      case 2:
        return '#006D32';
      case 3:
        return '#26A641';
      case 4:
        return '#39D353';
      case 0:
      default:
        return 'var(--heatmap-empty, #1A1D24)';
    }
  };

  // Total completions in past 364 days
  const totalCompletedYear = useMemo(() => {
    let sum = 0;
    grid.forEach((row) => {
      row.forEach((cell) => {
        sum += cell.completedCount;
      });
    });
    return sum;
  }, [grid]);

  return (
    <div className="bg-white dark:bg-[#16181F] border border-slate-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-card relative transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              Активність за рік (52 тижні)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalCompletedYear} виконаних цілей за останній рік
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 bg-slate-100 dark:bg-white/[0.02] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5">
          <span>Менше</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-200 dark:bg-[#1A1D24] border border-slate-300 dark:border-white/5" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#0E4429]" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#006D32]" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#26A641]" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#39D353]" />
          </div>
          <span>Більше</span>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        <div className="inline-block min-w-max">
          {/* Months Header Row */}
          <div className="flex mb-1.5 pl-7 text-[10px] text-gray-400 font-medium">
            <div className="relative h-4 w-full">
              {monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  className="absolute"
                  style={{ left: `${m.weekIndex * 13}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Days Grid & Row Labels */}
          <div className="flex gap-2">
            {/* Days of week labels (Пн, Ср, Пт) */}
            <div className="flex flex-col justify-between py-[1px] text-[10px] text-gray-400 font-medium select-none w-5">
              <span>Пн</span>
              <span>Ср</span>
              <span>Пт</span>
              <span>Нд</span>
            </div>

            {/* 7 rows x 52 cols Grid */}
            <div className="flex flex-col gap-[3px]">
              {grid.map((row, rowIdx) => (
                <div key={rowIdx} className="flex gap-[3px]">
                  {row.map((cell) => {
                    const isToday = cell.dateStr === logicalTodayStr;
                    return (
                      <div
                        key={cell.dateStr}
                        className={`w-[10px] h-[10px] rounded-[2px] transition-transform duration-100 hover:scale-150 hover:z-20 cursor-pointer relative ${
                          isToday ? 'ring-1 ring-white/60' : ''
                        }`}
                        style={{
                          backgroundColor: getCellBg(cell.level),
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            cell,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip matching SKILLS.md */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-[#0E1017] border border-white/15 text-white px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y - 8}px`,
          }}
        >
          <div className="font-semibold text-gray-200 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatDateUkrainian(hoveredCell.cell.dateStr)}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            <span className="text-emerald-400 font-bold">
              {hoveredCell.cell.completedCount} з {hoveredCell.cell.totalActive}
            </span>{' '}
            звичок виконано ({hoveredCell.cell.percentage}%)
          </div>
        </div>
      )}
    </div>
  );
};

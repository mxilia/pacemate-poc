'use client'

import { useEffect, useRef, useState } from 'react'
import type { CompletedRun } from '@/types/coach-ai'

export function DistanceChart({ runs, baseline }: { runs: CompletedRun[]; baseline: number }) {
  const [range, setRange] = useState(6)
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartSize, setChartSize] = useState({ width: 570, height: 165 })

  useEffect(() => {
    const element = chartRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setChartSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const plotLeft = 36
  const plotRight = chartSize.width - 12
  const plotTop = 20
  const plotBottom = chartSize.height - 26
  const plotHeight = plotBottom - plotTop
  const now = new Date()
  const points = Array.from({ length: range }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - range + index + 1, 1)
    const distances = runs
      .filter((run) => {
        const date = new Date(run.date)
        return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth()
      })
      .map((run) => run.distanceKm)
    return {
      label: month.toLocaleDateString('en-US', { month: 'short' }),
      value: Math.max(...distances, index === range - 1 ? baseline : 0, 0),
      hasData: distances.length > 0 || (index === range - 1 && baseline > 0),
    }
  })
  const ceiling = Math.max(10, Math.ceil(Math.max(...points.map((point) => point.value)) / 5) * 5)
  const chartPoints = points.map((point, index) => ({
    ...point,
    x: plotLeft + (index * (plotRight - plotLeft)) / (range - 1),
    y: plotBottom - (point.value / ceiling) * plotHeight,
  }))
  const line = chartPoints
    .filter((point) => point.hasData)
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
  return (
    <article className="sport-panel flex h-[300px] flex-col lg:col-span-6 lg:col-start-7 lg:row-start-3 lg:h-[280px]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="panel-title">Distance progression</h2>
          <p className="mt-1 text-xs text-[#526580]">Longest run each month</p>
        </div>
        <div
          className="flex rounded-md border border-[#b9cbea] p-1"
          role="group"
          aria-label="Chart range"
        >
          {[3, 6].map((months) => (
            <button
              key={months}
              className={`rounded px-3 py-1 text-xs ${range === months ? 'bg-[#3052af] text-white' : 'text-[#526580]'}`}
              aria-pressed={range === months}
              onClick={() => setRange(months)}
              type="button"
            >
              {months}M
            </button>
          ))}
        </div>
      </div>
      <div ref={chartRef} className="mt-3 mb-2 min-h-0 flex-1">
        <svg
          className="h-full w-full"
          viewBox={`0 0 ${chartSize.width} ${chartSize.height}`}
          role="img"
          aria-label="Longest running distance by month, kilometers on the vertical axis"
        >
          <text x="8" y="13" fill="#526580" fontSize="10">
            km
          </text>
          {[0, 1, 2, 3, 4].map((tick) => (
            <g key={tick}>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={plotBottom - (tick * plotHeight) / 4}
                y2={plotBottom - (tick * plotHeight) / 4}
                stroke="#d3dce9"
                strokeDasharray="3 5"
              />
              <text
                x={plotLeft - 10}
                y={plotBottom + 4 - (tick * plotHeight) / 4}
                fill="#526580"
                fontSize="11"
                textAnchor="end"
              >
                {(ceiling * tick) / 4}
              </text>
            </g>
          ))}
          <polyline
            points={line}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {chartPoints.map((point) => (
            <g key={point.label}>
              <text
                x={point.x}
                y={chartSize.height - 4}
                fill="#526580"
                fontSize="11"
                textAnchor="middle"
              >
                {point.label}
              </text>
              {point.hasData ? (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#ffffff"
                  stroke="#1b3558"
                  strokeWidth="3"
                >
                  <title>
                    {point.label}: {point.value.toFixed(1)} km
                  </title>
                </circle>
              ) : null}
            </g>
          ))}
          {!chartPoints.some((point) => point.hasData) ? (
            <text
              x={(plotLeft + plotRight) / 2}
              y={(plotTop + plotBottom) / 2}
              fill="#526580"
              fontSize="12"
              textAnchor="middle"
            >
              Your first run starts the chart
            </text>
          ) : null}
        </svg>
      </div>
    </article>
  )
}

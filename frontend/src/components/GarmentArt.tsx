import { useId } from 'react';
import type { ClothingItem } from '../types';

interface Props { item: ClothingItem; className?: string; compact?: boolean }
export default function GarmentArt({ item, className = '', compact = false }: Props) {
  const uid = useId().replace(/:/g,'');
  const gradient = `g${uid}`;
  const shadow = `s${uid}`;
  if (item.image) return <div className={`garment-art photo-art ${className}`}><img src={item.image} alt={item.name} loading="lazy" /></div>;
  const primary = item.hex;
  const line = '#4A4052';
  const common = {fill:`url(#${gradient})`, stroke:line, strokeOpacity:0.20, strokeWidth:2.0, strokeLinejoin:'round' as const};
  return <div className={`garment-art ${className}`} aria-label={`Ilustração: ${item.name}`} role="img">
    <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" className={compact ? 'art-small' : ''}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".42"/><stop offset=".32" stopColor={primary}/><stop offset="1" stopColor={primary}/></linearGradient>
        <filter id={shadow} x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#594A67" floodOpacity=".15"/></filter>
      </defs>
      <g filter={`url(#${shadow})`}>
      {item.category === 'tops' && <>
        <path d="M67 31 82 22 Q100 33 118 22 L134 31 177 56 156 95 140 85 142 187 Q101 199 58 187 L60 85 44 95 23 56Z" {...common}/>
        <path d="M82 22 Q101 58 118 22" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="5"/>
        <path d="M61 85 62 176M138 85 137 177M69 186 Q100 194 130 186" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="2"/>
        <path d="M23 56 44 95 57 84 M177 56 156 95 143 84" fill="none" stroke="#2e2434" strokeOpacity=".1" strokeWidth="2"/>
      </>}
      {item.category === 'bottoms' && <>
        <path d="M57 25 Q99 32 143 25 L157 191 114 195 100 104 86 195 43 191Z" {...common}/>
        <path d="M57 47 Q99 55 144 47M100 33V100M64 60 75 75M134 60 125 75" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="3"/>
        <path d="M88 192 100 109 113 192" fill="none" stroke="#322B38" strokeOpacity=".15" strokeWidth="2"/>
        <path d="M43 185 85 189M115 189 157 185" stroke="#fff" strokeOpacity=".5" strokeWidth="3"/>
      </>}
      {item.category === 'dresses' && <>
        <path d="M75 28 Q100 40 125 28 L145 51 129 82 146 116 173 185 Q101 203 27 185 L54 116 71 82 55 51Z" {...common}/>
        <path d="M75 28 Q101 64 125 28" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="5"/>
        <path d="M71 82 Q101 90 129 82M74 98 48 177M126 98 152 177" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="3"/>
        <path d="M54 116 Q102 133 146 116" fill="none" stroke="#39313f" strokeOpacity=".08" strokeWidth="2"/>
      </>}
      {item.category === 'outerwear' && <>
        <path d="M74 23 91 30 109 30 126 23 149 39 175 78 157 103 143 91 147 195 53 195 57 91 43 103 25 78 51 39Z" {...common}/>
        <path d="M74 23 98 45 86 83 104 188 100 194 90 185 68 63Z" fill="#fff" fillOpacity=".19" stroke="#fff" strokeOpacity=".35" strokeWidth="2"/>
        <path d="M126 23 102 45 114 83 96 188 100 194 110 185 132 63Z" fill="#372D40" fillOpacity=".13" stroke="#33283B" strokeOpacity=".15" strokeWidth="2"/>
        <path d="M100 46V193M62 117 78 117 78 143 62 143M122 117 138 117 138 143 122 143" fill="none" stroke="#fff" strokeOpacity=".42" strokeWidth="2"/>
        <circle cx="109" cy="107" r="2.5" fill="#fff"/><circle cx="109" cy="143" r="2.5" fill="#fff"/>
      </>}
      {item.category === 'shoes' && <>
        <path d="M30 107 Q42 90 56 91 L79 111 110 122 Q123 132 117 148 L109 164 25 164 Q14 153 20 137Z" {...common}/>
        <path d="M96 67 Q110 54 122 55 L143 79 176 90 Q192 103 181 123 L174 138 91 138 Q83 125 88 105Z" {...common}/>
        <path d="M19 150 Q67 163 116 151M88 126 Q139 140 180 126" fill="none" stroke="#fff" strokeOpacity=".84" strokeWidth="7"/>
        <path d="M44 115 64 122M41 123 61 130M116 81 135 89M112 90 131 97" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round"/>
      </>}
      {item.category === 'bags' && <>
        <path d="M65 88V65 Q65 26 101 26 Q136 26 136 65V88" fill="none" stroke={primary} strokeWidth="16" strokeLinecap="round"/>
        <path d="M48 82 Q101 75 153 82 L163 185 Q100 202 37 185Z" {...common}/>
        <path d="M48 99 Q100 111 153 99M53 177 Q102 188 148 177" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="3"/>
        <rect x="89" y="108" width="23" height="13" rx="4" fill="#f7e9d5" stroke="#594654" strokeOpacity=".3"/>
      </>}
      {item.category === 'accessories' && <>
        <path d="M20 101 Q20 85 43 86 L73 91 Q99 94 100 113 Q101 94 126 91 L157 86 Q180 85 180 101 L177 132 Q166 155 140 153 Q114 151 111 126 L89 126 Q85 151 59 153 Q33 155 23 132Z" {...common}/>
        <path d="M25 101 16 96M175 101 185 96" fill="none" stroke="#493c51" strokeWidth="6" strokeLinecap="round"/>
        <path d="M34 105 71 112M121 111 158 105" stroke="#fff" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round"/>
      </>}
      </g>
    </svg>
  </div>;
}

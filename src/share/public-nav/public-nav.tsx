import React from 'react';

export default function PublicNav() {
  return (
    <nav className="bg-[#2b1818] w-full">
      <div className="flex justify-between items-center h-12 w-full px-8">
        <h1 className="text-white font-bold text-xl">第五人格分析器</h1>
        <ul className="flex gap-6 text-slate-300">
          <li className="hover:text-cyan-400 cursor-pointer">首頁</li>
          <li className="hover:text-cyan-400 cursor-pointer">數據分析</li>
        </ul>
        <div className="flex items-center gap-2 pr-16">
          <button className="bg-cyan-400 text-white px-4 py-2 rounded">登入</button>
          <button className="bg-cyan-400 text-white px-4 py-2 rounded">註冊</button>
        </div>
      </div>
    </nav>
  );
}
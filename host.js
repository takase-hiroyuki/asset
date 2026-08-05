import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://dtgfdtsiggljqczvqcgy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8NKvxlnYvvD1ImNdYyj6Bg_DofuOnn1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById('distributeBtn').addEventListener('click', async () => {
  const allItems = ['item01', 'item02', 'item03', 'item04', 'item05', 'item06', 'item07', 'item08', 'item09', 'item10'];
  const players = ['user1', 'user2', 'user3'];
  
  // 振り分け用の空の配列を準備
  const userItems = { user1: [], user2: [], user3: [] };

  // 10個のアイテムを1つずつランダムなプレイヤーに割り当て
  allItems.forEach(item => {
    const randomPlayer = players[Math.floor(Math.random() * players.length)];
    userItems[randomPlayer].push(item);
  });

  // 振り分けた結果をSupabaseに保存（3人分）
  for (const player of players) {
    const { error } = await supabase
      .from('users')
      .update({ items: userItems[player] })
      .eq('id', player);

    if (error) {
      console.error(`${player}の更新エラー:`, error);
      alert('エラーが発生しました。コンソールを確認してください。');
      return;
    }
  }

  // --- ここから追加：画面に結果を表示する処理 ---
  const resultList = document.getElementById('resultList');
  resultList.innerHTML = ''; // リストを一度空っぽにする

  for (const player of players) {
    const li = document.createElement('li');
    // 配列をカンマ区切りの文字列にして表示（例: user1: item03, item09）
    li.textContent = `${player}: ${userItems[player].join(', ')}`;
    resultList.appendChild(li);
  }
  // --- ここまで追加 ---

  console.log('振り分け結果:', userItems);
});

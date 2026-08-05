import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://dtgfdtsiggljqczvqcgy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8NKvxlnYvvD1ImNdYyj6Bg_DofuOnn1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 変更：Supabaseから最新のデータを取得して画面に表示する関数 ---
async function fetchAllAndDisplay() {
  const players = ['user1', 'user2', 'user3'];
  const resultList = document.getElementById('resultList');
  
  resultList.innerHTML = '<li>読み込み中...</li>';

  const { data, error } = await supabase
    .from('users')
    .select('id, items')
    .in('id', players); // user1, user2, user3 だけを取得

  if (error) {
    console.error('取得エラー:', error);
    resultList.innerHTML = '<li>データの取得に失敗しました</li>';
    return;
  }

  resultList.innerHTML = ''; // リストを一度空っぽにする

  // 取得したデータを表示
  data.forEach(user => {
    const li = document.createElement('li');
    // アイテムがある場合はカンマ区切り、ない場合は「アイテムなし」と表示
    const itemsText = user.items && user.items.length > 0 ? user.items.join(', ') : 'アイテムなし';
    li.textContent = `${user.id}: ${itemsText}`;
    resultList.appendChild(li);
  });
}
// ------------------------------------

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
  // ※ここで手動で画面を更新しなくても、下のリアルタイム検知が作動して画面が変わります
});

// ==========================================
// 追加：リアルタイムでデータの変更を検知する設定
// ==========================================
supabase
  .channel('public:users_host')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'users' },
    (payload) => {
      console.log('Host画面でデータ変更を検知:', payload);
      // データに変更があったら、最新状態を取得して表示し直す
      fetchAllAndDisplay();
    }
  )
  .subscribe();

// ==========================================
// 追加：リアルタイムで game_state（手番）の変更を検知する設定
// ==========================================
supabase
  .channel('public:game_state_channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'game_state' },
    (payload) => {
      console.log('手番のデータ変更を検知:', payload);
      // ※ここに画面の表示を更新する処理を追加します（次のステップで作ります！）
    }
  )
  .subscribe();


// 画面を最初に開いたときにも最新状態を表示する
fetchAllAndDisplay();

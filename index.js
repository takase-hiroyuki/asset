import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// host.js と同じSupabaseの設定
const SUPABASE_URL = 'https://dtgfdtsiggljqczvqcgy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8NKvxlnYvvD1ImNdYyj6Bg_DofuOnn1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 選択されたユーザーのアイテムを取得して表示する関数
async function fetchAndDisplayItems() {
  const selectedUser = document.getElementById('userSelect').value;
  const myItemsList = document.getElementById('myItemsList');

  // 取得中のメッセージ
  myItemsList.innerHTML = '<li>読み込み中...</li>';

  // Supabaseから該当ユーザーのデータを取得
  const { data, error } = await supabase
    .from('users')
    .select('items')
    .eq('id', selectedUser)
    .single();

  if (error) {
    console.error('エラー:', error);
    myItemsList.innerHTML = '<li>データの取得に失敗しました</li>';
    return;
  }

  // リストを一度空っぽにする
  myItemsList.innerHTML = '';

  const items = data.items || [];

  // アイテムが1つもない場合の表示
  if (items.length === 0) {
    myItemsList.innerHTML = '<li>アイテムを持っていません</li>';
    return;
  }

  // アイテムを1つずつリスト(li)にして追加
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    myItemsList.appendChild(li);
  });
}

// セレクトボックスの選択が切り替わったときに実行する
document.getElementById('userSelect').addEventListener('change', fetchAndDisplayItems);

// 画面を最初に開いたときにも実行する（初期表示）
fetchAndDisplayItems();

// ==========================================
// 追加：リアルタイムでデータの変更を検知する設定
// ==========================================
supabase
  .channel('public:users')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'users' },
    (payload) => {
      console.log('データ変更を検知:', payload);
      // usersテーブルに変化があったら、アイテムを再取得して表示を更新
      fetchAndDisplayItems();
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

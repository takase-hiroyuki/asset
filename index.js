import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabaseの設定
const SUPABASE_URL = 'https://dtgfdtsiggljqczvqcgy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8NKvxlnYvvD1ImNdYyj6Bg_DofuOnn1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 選択されたユーザーのアイテムを取得して表示する関数
async function fetchAndDisplayItems() {
  const selectedUser = document.getElementById('userSelect').value;
  const myItemsList = document.getElementById('myItemsList');

  // 取得中のメッセージ
  myItemsList.innerHTML = '<li>読み込み中...</li>';

  // Supabaseから該当ユーザーのデータを取得（.single()を外して配列で受け取る）
  const { data, error } = await supabase
    .from('users')
    .select('items')
    .eq('id', selectedUser);

  // エラーが発生した場合の処理
  if (error) {
    console.error('エラー:', error);
    myItemsList.innerHTML = '<li>データの取得に失敗しました</li>';
    return;
  }

  // リストを一度空っぽにする
  myItemsList.innerHTML = '';

  // データの中身を安全に取り出す（データがない場合は空の配列にする）
  let items = [];
  if (data && data.length > 0) {
    items = data[0].items || [];
  }

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

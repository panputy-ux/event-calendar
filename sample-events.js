// STEP 2 までは仮データを使用します。実際の予定への置き換えは次の工程で行います。
// Googleスプレッドシート接続時は、このデータ取得部分を差し替えます。
window.EVENT_CALENDAR_DATA = {
  parents: [
    {
      id: "avatar-event",
      name: "同アバター改変会（サンプル）",
      description: "指定されたアバターの組み合わせで、チームごとに共通テーマに沿った改変を行うイベントです。\nテーマ決定や写真提出の日程を、このイベントにまとめて管理します。",
      color: "#8062a6"
    },
    {
      id: "meetup",
      name: "月例集会（サンプル）",
      description: "メンバーで集まる月例交流イベントです。集合時間や開催日程などをお知らせします。",
      color: "#397d78"
    },
    {
      id: "showcase",
      name: "作品展示会（サンプル）",
      description: "制作した作品を共有する企画です。受付期間や展示期間などの複数日程をまとめて表示できます。",
      color: "#477ca6"
    }
  ],
  children: [
    { id: "e01", parentId: "avatar-event", title: "テーマ決定期限", startDate: "2026-11-21", endDate: "2026-11-21", description: "チームで決めたテーマを報告する期限です。" },
    { id: "e02", parentId: "avatar-event", title: "写真提出期間", startDate: "2026-11-30", endDate: "2026-12-06", description: "期間内に作品の写真を提出してください。" },
    { id: "e03", parentId: "meetup", title: "11月集会", startDate: "2026-11-14", endDate: "2026-11-14", startTime: "22:00", endTime: "24:00", description: "みんなで集まる交流会です。" },
    { id: "e04", parentId: "showcase", title: "参加受付期間", startDate: "2026-11-02", endDate: "2026-11-06", description: "参加申請を受け付ける期間です。" },
    { id: "e05", parentId: "showcase", title: "作品展示期間", startDate: "2026-11-23", endDate: "2026-11-27", description: "作品を展示する期間です。" },
    { id: "e06", parentId: "showcase", title: "作品公開", startDate: "2026-12-07", endDate: "2026-12-07", startTime: "20:00", description: "展示作品を公開します。" }
  ]
};

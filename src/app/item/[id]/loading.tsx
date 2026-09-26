export default function ItemLoading() {
  return (
    <div className="loading-page" aria-busy="true" aria-label="正在加载内容">
      <div className="loading-line short" />
      <div className="loading-line title" />
      <div className="loading-line" />
      <div className="loading-card" />
    </div>
  );
}

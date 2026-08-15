export default function Home() {
  return (
    <div className="container animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1>Polaris QA</h1>
        <a href="/harvest" className="btn btn-primary">Enter Harvest Data</a>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-panel">
          <h2>Harvest Entry</h2>
          <p className="mb-4">Log daily harvest records and field rejects.</p>
          <a href="/harvest" className="btn btn-primary">Go to Harvest</a>
        </div>
        
        <div className="glass-panel">
          <h2>Packhouse Entry</h2>
          <p className="mb-4">Log packhouse processing and reject types.</p>
          <a href="/packhouse" className="btn btn-secondary">Go to Packhouse</a>
        </div>
      </div>

      <div className="glass-panel">
        <h2>Dashboard Preview</h2>
        <p>Integration with Grafana will be placed here or accessible via the dashboard menu.</p>
      </div>
    </div>
  );
}

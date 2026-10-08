import { Icon } from "./ui-icon";

export function TvVisual() {
  return <div className="tv-visual" aria-hidden="true">
    <div className="tv-orbit" /><div className="tv-orbit outer" />
    <div className="tv-frame">
      <div className="tv-screen">
        <span className="tv-screen-brand">MCZ <span>onTV</span></span>
        <div className="screen-glow" /><div className="screen-landscape" />
        <span className="tv-play"><Icon name="play" /></span>
        <div className="tv-caption"><small>SEU MOMENTO DE DAR PLAY</small><strong>Entre. Escolha. Aproveite.</strong></div>
        <div className="tv-progress"><span /></div>
      </div>
      <div className="tv-base"><span /></div>
    </div>
    <span className="tv-floating-label"><Icon name="tv" /> Seu entretenimento começa aqui.</span>
  </div>;
}

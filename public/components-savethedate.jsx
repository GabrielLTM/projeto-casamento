// Save the Date — primeira seção do site, para eventos com `saveTheDate`
// em EVENTS (chá e casamento). Rolando para baixo vem o Hero e o resto.
// Data e local vêm da view (/api/config).
function SaveTheDate({ ev }) {
  const E = ev0(ev);
  const cfg = E.saveTheDate;
  if (!cfg) return null;

  const [day, month, year] = E.date.short.split(".");
  const tree = cfg.art === "arvore";

  return (
    <section className="std" aria-label={`Save the date — ${E.date.long}`} data-screen-label="00 Save the date">
      <div className="std-inner">
        <img
          className={`std-art std-r std-d1 ${tree ? "std-art-tree" : ""}`}
          src={`assets/savethedate/${cfg.art}.png`}
          alt=""
        />
        <div className="std-names std-r std-d2" aria-hidden="true">
          <span>Gabriel</span>
          <span className="std-e">e</span>
          <span>Kamilly</span>
        </div>
        <div className="std-kicker std-r std-d3">{cfg.kicker}</div>
        <div className="std-title std-r std-d3">SAVE THE DATE</div>
        <div className="std-date std-r std-d4">
          <span>{day}</span><i /><span>{month}</span><i /><span>{year}</span>
        </div>
        {/* label: nome do evento no lugar do local (chá), para o convidado saber do que se trata */}
        <div className="std-place std-r std-d4">{cfg.label || E.place.short}</div>
        <p className="std-verse std-r std-d5">
          “Deus é amor. Todo aquele que permanece no amor permanece em Deus, e Deus nele.”
          <small>— 1 João 4:16</small>
        </p>
        <a href="#inicio" className="std-enter std-r std-d5">role para entrar</a>
      </div>
    </section>
  );
}

Object.assign(window, { SaveTheDate });

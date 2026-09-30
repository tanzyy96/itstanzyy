import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { ACCENTS, type DeskCardDef } from "@/lib/desk";
import styles from "./desk.module.css";

export type CardPlacement = { x: number; y: number; z: number; rot: number };

type Props = {
  def: DeskCardDef;
  placement: CardPlacement;
  open: boolean;
  flipped: boolean;
  dragging: boolean;
  dimmed: boolean;
  /** List mode on narrow screens: no world transform, no drag. */
  inList: boolean;
  onCardPointerDown: (event: PointerEvent) => void;
  onToggle: () => void;
  onFlip: () => void;
  children: ReactNode;
};

const EASE = "cubic-bezier(.22,.9,.25,1)";

// Controls inside a card must not start a drag (or, on release, a toggle)
// on the card beneath them.
const stop = (event: PointerEvent) => event.stopPropagation();

export default function DeskCard({
  def,
  placement,
  open,
  flipped,
  dragging,
  dimmed,
  inList,
  onCardPointerDown,
  onToggle,
  onFlip,
  children,
}: Props) {
  const { accent, wash } = ACCENTS[def.accent];
  const shadow = open
    ? "16px 20px 0 rgba(20,19,15,.14)"
    : dragging
      ? "18px 22px 0 rgba(20,19,15,.16)"
      : "3px 5px 0 rgba(20,19,15,.13)";
  const rot = open ? 0 : placement.rot;

  const wrapStyle = inList
    ? { zIndex: open ? 2 : 1 }
    : {
        width: open ? def.exp : def.w,
        zIndex: placement.z,
        opacity: dimmed ? 0.45 : 1,
        transform: `translate3d(${placement.x}px, ${placement.y}px, 0) rotate(${rot}deg) scale(${dragging ? 1.04 : 1})`,
        transition: dragging
          ? `width .4s ${EASE}`
          : `transform .45s ${EASE}, width .45s ${EASE}, opacity .3s ease`,
      };

  return (
    <div className={styles.cardWrap} style={wrapStyle} data-card={def.id}>
      <div
        className={`${styles.cardBob} ${open || dragging || inList ? "" : styles.bobbing}`}
        style={{ "--bob-duration": `${5 + (def.w % 4)}s` } as CSSProperties}
      >
        <div className={styles.cardFlip} style={{ transform: `rotateY(${flipped ? 180 : 0}deg)` }}>
          <section
            className={styles.cardFront}
            style={{ boxShadow: shadow, cursor: inList ? "default" : dragging ? "grabbing" : "pointer" }}
            onPointerDown={onCardPointerDown}
            aria-label={def.title}
          >
            <div className={styles.accentBar} style={{ background: accent }} />
            <div
              className={styles.tape}
              style={{ left: def.tapeX, transform: `rotate(${def.tapeRot}deg)`, opacity: open ? 0 : 1 }}
            />

            <div className={styles.cardHead}>
              <div style={{ minWidth: 0 }}>
                <div className={styles.meta}>{def.meta}</div>
                <h2 className={`${styles.title} ${open ? styles.titleOpen : ""}`}>{def.title}</h2>
              </div>
              <button
                className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
                onPointerDown={stop}
                onClick={onToggle}
                aria-expanded={open}
                aria-label={open ? `Fold ${def.title}` : `Unfold ${def.title}`}
              >
                {"↓"}
              </button>
            </div>

            {open ? (
              <div className={styles.body} onPointerDown={stop}>
                {children}
                <button className={`${styles.pillBtn} ${styles.foldBtn}`} onClick={onToggle}>
                  FOLD BACK UP
                </button>
              </div>
            ) : (
              <div>
                <p className={styles.blurb}>{def.blurb}</p>
                <div className={styles.tag} style={{ background: wash }}>
                  {def.tag}
                </div>
                <button
                  className={styles.corner}
                  onPointerDown={stop}
                  onClick={onFlip}
                  title="Flip the card"
                  aria-label={`Flip ${def.title}`}
                />
              </div>
            )}
          </section>

          <div
            className={styles.cardBack}
            style={{ background: wash, boxShadow: shadow }}
            onPointerDown={onCardPointerDown}
            aria-hidden={!flipped}
          >
            <div>
              <div className={styles.meta}>BACK OF CARD</div>
              <p className={styles.backQuote}>{def.back}</p>
            </div>
            <button
              className={`${styles.pillBtn} ${styles.flipBack}`}
              onPointerDown={stop}
              onClick={onFlip}
              tabIndex={flipped ? 0 : -1}
            >
              FLIP BACK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

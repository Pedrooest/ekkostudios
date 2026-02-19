import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape } from 'tldraw';

// Define the shape type extending TLBaseShape with w/h in props
export type NoteShape = TLBaseShape<
    'note',
    {
        w: number
        h: number
        text: string
        color: string
    }
>

export class NoteShapeUtil extends BaseBoxShapeUtil<NoteShape> {
    static override type = 'note' as const

    override getDefaultProps(): NoteShape['props'] {
        return {
            w: 200,
            h: 200,
            text: 'Nova Nota',
            color: 'blue',
        }
    }

    override component(shape: NoteShape) {
        return (
            <HTMLContainer className="ekko-shape-container" style={{ backgroundColor: shape.props.color === 'blue' ? '#1E293B' : '#334155' }}>
                <div className="ekko-shape-header">
                    <i className="fa-solid fa-note-sticky ekko-shape-icon"></i>
                    <span className="ekko-shape-title">Nota</span>
                </div>
                <div className="ekko-shape-content">
                    {shape.props.text}
                </div>
            </HTMLContainer>
        )
    }

    override indicator(shape: NoteShape) {
        return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />
    }
}

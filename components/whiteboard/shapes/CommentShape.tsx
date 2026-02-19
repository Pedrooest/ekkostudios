import { BaseBoxShapeUtil, HTMLContainer, TLBaseBoxShape } from 'tldraw'

export type CommentShape = TLBaseBoxShape & {
    type: 'comment'
    props: {
        w: number
        h: number
        text: string
        author: string
    }
}

export class CommentShapeUtil extends BaseBoxShapeUtil<CommentShape> {
    static override type = 'comment' as const

    override getDefaultProps(): CommentShape['props'] {
        return {
            w: 200,
            h: 100,
            text: '',
            author: 'User',
        }
    }

    override component(shape: CommentShape) {
        return (
            <HTMLContainer className="ekko-shape-container pointer-events-auto">
                <div className="flex flex-col h-full bg-[#FEF3C7] text-slate-800 rounded-bl-xl rounded-tr-xl rounded-tl-xl p-3 shadow-lg border border-yellow-400/50 relative">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold uppercase text-yellow-800/60">{shape.props.author}</span>
                        <i className="fa-solid fa-comment text-yellow-500/40 text-xs"></i>
                    </div>

                    <textarea
                        className="w-full h-full bg-transparent resize-none outline-none text-xs font-medium placeholder-yellow-800/30"
                        placeholder="Escreva um comentário..."
                        value={shape.props.text}
                        onChange={(e) => {
                            this.editor.updateShape({
                                id: shape.id,
                                type: 'comment',
                                props: { text: e.target.value }
                            } as any)
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                    />

                    {/* Tail */}
                    <div className="absolute -bottom-2 -left-0 w-4 h-4 bg-[#FEF3C7] border-b border-l border-yellow-400/50 transform rotate-45 skew-x-12"></div>
                </div>
            </HTMLContainer>
        )
    }

    override indicator(shape: CommentShape) {
        return <rect width={shape.props.w} height={shape.props.h} rx={12} ry={12} />
    }
}

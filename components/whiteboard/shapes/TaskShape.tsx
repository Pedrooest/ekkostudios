import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape } from 'tldraw';

export type TaskShape = TLBaseShape<
    'ekko-task',
    {
        w: number
        h: number
        taskId: string
        title: string
        status: string
        assignee: string
    }
>

export class TaskShapeUtil extends BaseBoxShapeUtil<TaskShape> {
    static override type = 'ekko-task' as const

    override getDefaultProps(): TaskShape['props'] {
        return {
            w: 240,
            h: 160,
            taskId: '',
            title: 'Nova Tarefa',
            status: 'todo',
            assignee: 'Unassigned',
        }
    }

    override component(shape: TaskShape) {
        return (
            <HTMLContainer className="ekko-shape-container ekko-shape-task">
                <div className="flex justify-between items-start mb-2">
                    <span className="ekko-shape-title text-sm">{shape.props.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${shape.props.status === 'done' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {shape.props.status}
                    </span>
                </div>

                <div className="ekko-shape-content mt-2">
                    <p className="opacity-70 text-xs">ID: {shape.props.taskId}</p>
                </div>

                <div className="ekko-shape-footer">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                            {shape.props.assignee.charAt(0).toUpperCase().replace(/[^A-Z]/g, '') || '?'}
                        </div>
                        <span className="text-[10px] text-slate-400">{shape.props.assignee}</span>
                    </div>
                </div>
            </HTMLContainer>
        )
    }

    override indicator(shape: TaskShape) {
        return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />
    }
}

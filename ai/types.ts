import { TableType } from '../types';

export type AssistantMode = 'chat' | 'action';

export interface AssistantAction {
    type:
    | 'create_planning_item'
    | 'update_planning_item'
    | 'create_task'
    | 'update_task'
    | 'suggest_rdc'
    | 'create_client'
    | 'update_client'
    | 'add_notification';
    payload: any;
}

export interface AssistantIssue {
    title: string;
    why: string;
    severity: 'low' | 'medium' | 'high';
}

export interface AssistantRecommendation {
    title: string;
    steps: string[];
    expected_impact: string;
}

export interface AssistantPresentation {
    slide_title: string;
    key_points: string[];
    callouts: { target: string; text: string; top?: string; left?: string }[];
    next_step: string;
}

export interface AssistantResponse {
    summary: string;
    issues: AssistantIssue[];
    recommendations: AssistantRecommendation[];
    actions: AssistantAction[];
    presentation?: AssistantPresentation;
}

export interface AssistantContext {
    tab: TableType;
    data: any;
    userNotes?: string;
}

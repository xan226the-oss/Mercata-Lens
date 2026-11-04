export interface AspectAnnotation {topic:string;sentiment:'正面'|'负面'|'中性';evidence:string;reason:string}
export const TOPICS:{name:string;en:string;group:string;definition:string}[];
export const SENTIMENTS:AspectAnnotation['sentiment'][];
export const ASPECT_REVISION:string;
export function validateAnnotations(value:unknown,text:string):value is AspectAnnotation[];

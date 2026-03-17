export interface ICodeNode {
  id: string;
  position: { x: number; y: number };
  data: {
    code: string;
    label: string;
  };
}
import { parse, test as liqeTest, type ParserAst } from 'liqe'
import type { JsonRecord } from './parse-dataset'

export type CompiledQuery =
  | { ok: true; test: (record: JsonRecord) => boolean }
  | { ok: false; error: string }

export function compileQuery(text: string): CompiledQuery {
  if (text.trim() === '') {
    return { ok: true, test: () => true }
  }
  try {
    const ast = parse(rewriteNotEquals(text))
    if (hasEmptyClause(ast)) {
      return { ok: false, error: 'Incomplete query' }
    }
    return { ok: true, test: (record) => Boolean(liqeTest(ast, record)) }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function rewriteNotEquals(text: string): string {
  return text.replace(/([^\s()]+):!=/g, 'NOT $1:')
}

function hasEmptyClause(node: ParserAst): boolean {
  switch (node.type) {
    case 'Tag':
      return node.expression.type === 'EmptyExpression'
    case 'LogicalExpression':
      return hasEmptyClause(node.left) || hasEmptyClause(node.right)
    case 'ParenthesizedExpression':
      return hasEmptyClause(node.expression)
    case 'UnaryOperator':
      return hasEmptyClause(node.operand)
    default:
      return false
  }
}

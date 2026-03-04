/**
 * Example Skill 实现
 */

export interface ExampleOptions {
  name: string;
  value?: number;
}

export interface ExampleResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * 示例函数
 */
export async function exampleFunction(options: ExampleOptions): Promise<ExampleResult> {
  try {
    // 实现你的逻辑
    const result = {
      success: true,
      data: {
        name: options.name,
        value: options.value || 0,
        timestamp: new Date().toISOString(),
      },
    };

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 另一个示例函数
 */
export function helperFunction(text: string): string {
  return text.toUpperCase();
}

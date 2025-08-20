
import pandas as pd
import os

# 读取Excel文件
file_path = "市政业绩.xlsx"
output_file = "市政业绩.md"

# 读取Excel文件的所有工作表
xls = pd.ExcelFile(file_path)

# 创建Markdown内容
markdown_content = "# 市政业绩\n\n"

# 遍历每个工作表
for sheet_name in xls.sheet_names:
    markdown_content += f"## {sheet_name}\n\n"

    # 读取工作表数据
    df = pd.read_excel(xls, sheet_name=sheet_name)

    # 转换为Markdown表格
    markdown_content += df.to_markdown(index=False, tablefmt="pipe")
    markdown_content += "\n\n"

# 写入Markdown文件
with open(output_file, "w", encoding="utf-8") as f:
    f.write(markdown_content)

print(f"Excel文件已成功转换为Markdown文件: {output_file}")

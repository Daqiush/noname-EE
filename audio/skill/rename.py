#批量重命名：去掉gz_前缀
import os
def batch_rename(directory):
    for filename in os.listdir(directory):
        if filename.startswith("gz_"):
            new_filename = filename[3:]  # 去掉前缀"gz_"
            os.rename(os.path.join(directory, filename), os.path.join(directory, new_filename))
            print(f'Renamed: {filename} -> {new_filename}')
# 使用示例
directory_path = '.'  # 替换为你的目录路径
batch_rename(directory_path)
@echo off
echo 正在准备提交更改...

:: 添加所有更改的文件
git add .

:: 提示用户输入提交信息
set /p commit_message="请输入提交信息: "

:: 执行提交
git commit -m "%commit_message%"

:: 推送到远程仓库
git push origin main

echo 提交完成!
pause

@echo off
echo ����׼���ύ����...

:: ������и��ĵ��ļ�
git add .

:: ��ʾ�û������ύ��Ϣ
set /p commit_message="�������ύ��Ϣ: "

:: ִ���ύ
git commit -m "%commit_message%"

:: ���͵�Զ�ֿ̲�
git push origin main

echo �ύ���!
pause

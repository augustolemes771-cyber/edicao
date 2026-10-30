# Converte os .MOV do iPhone (4K HDR 60 qps) de public/projetos/entrevista-3/ para o video.mp4 de cada projeto:
# 1440x2560, 30 qps em grade exata, HDR -> SDR, quadro-chave a cada 0,5 s. Cada .MOV é um vídeo; 11 + 11.1 viram um só.
# Uso (Git Bash, na raiz do projeto): bash scripts/converter-entrevista-3.sh [3 5 7 11 12 14]
# Com placa NVIDIA usa libplacebo + NVENC; sem ela, SEM_GPU=1 usa zscale + x264 (mais lento).
set -e
cd "$(dirname "$0")/.."
O=public/projetos/entrevista-3
if [ "$SEM_GPU" = "1" ]; then
	HDR='zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p'
	DEV=''
	VENC='-c:v libx264 -preset medium -crf 20'
else
	HDR='libplacebo=tonemapping=bt.2390:colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv:format=yuv420p'
	DEV='-init_hw_device vulkan'
	VENC='-c:v h264_nvenc -preset p5 -rc vbr -cq 21 -b:v 0 -profile:v high'
fi
ENC="$VENC -g 15 -bf 0 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 256k -movflags +faststart"
V="$HDR,scale=1440:2560:flags=lanczos,fps=30,format=yuv420p,setsar=1"
A='aresample=48000,aformat=channel_layouts=stereo'
for n in ${@:-3 5 7 11 12 14}; do
	mkdir -p public/projetos/entrevista-3-v$n
	saida=public/projetos/entrevista-3-v$n/video.mp4
	if [ "$n" = "11" ]; then
		ffmpeg -hide_banner -loglevel error -stats -y $DEV -i $O/11.MOV -i $O/11.1.MOV -filter_complex "[0:v]$V[v0];[1:v]$V[v1];[0:a]$A[a0];[1:a]$A[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[vc][a];[vc]setpts=N/30/TB[v]" -map "[v]" -map "[a]" $ENC $saida
	else
		ffmpeg -hide_banner -loglevel error -stats -y $DEV -i $O/$n.MOV -filter_complex "[0:v]$V,setpts=N/30/TB[v];[0:a]$A[a]" -map "[v]" -map "[a]" $ENC $saida
	fi
	echo "pronto: $saida"
done

until npm run build; do
    echo "The Program 'c3po' crashed with exit code $?.  Respawning.." >&2
    sleep 1
done

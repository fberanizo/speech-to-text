# DOJOT Google Cloud Speech To Text

Provides a Docker image that adds a 'speech-to-text' node type to DOJOT dataflow.


## Building

```shell
docker build -t fberanizo/speech-to-text:latest -f Dockerfile .
```

## Adding the node type to DOJOT

```shell
JWT=$(curl -sSL -X POST "http://$(kubectl get service external-kong --namespace dojot --output jsonpath='{.status.loadBalancer.ingress[0].ip}')/auth" -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"passwd\":\"admin\"}"|perl -ne 'if(/"jwt":\s*"(.*?)"/){print"$1"}')

curl -H "Authorization: Bearer ${JWT}" "http://$(kubectl get service external-kong --namespace dojot --output jsonpath='{.status.loadBalancer.ingress[0].ip}')/flows/v1/node" -H "Content-Type: application/json" -d '{"image":"fberanizo/speech-to-text:latest","id":"speech-to-text"}'
```

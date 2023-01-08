FROM node:18

RUN npm install --global ganache@7.5.0

CMD ganache \
    --wallet.accounts $PRIVATE_KEY1,100000000000000000000 \
    --wallet.accounts $PRIVATE_KEY2,100000000000000000000 \
    --wallet.accounts $PRIVATE_KEY3,100000000000000000000 \
    --server.host 0.0.0.0

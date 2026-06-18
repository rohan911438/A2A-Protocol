from mycelium import contract, state, Symbol, i128

@contract
class MarketOracleAgent:
    provider: Symbol
    price_feed: i128

    @state.instance
    def initialize(self, owner: Symbol, initial_price: i128):
        self.provider = owner
        self.price_feed = initial_price

    @state.instance
    def update_price(self, caller: Symbol, new_price: i128) -> bool:
        if caller != self.provider:
            return False
        self.price_feed = new_price
        return True

    @state.instance
    def get_price(self) -> i128:
        return self.price_feed

from pyparsing import Word, alphas, alphanums, Suppress, ZeroOrMore, Group, Literal, OneOrMore, ParseResults, Forward, StringEnd

def if_2(s,l,t):
    if len(t[0]) > 1:
        #t[0].insert(0,'_or')
        new_list = ['_or']
        new_list.extend(t[0])
        return [new_list]
    else:
        return t[0]
        
def parse_modules(text):
    if len(text.strip()) == 0:
        return []
    # Tokens
    course = Word(alphanums)
    and_sep = Suppress(Literal("&"))
    or_sep = Suppress(Literal("or"))
    lparen = Suppress(Literal("("))
    rparen = Suppress(Literal(")"))
    end = Suppress(StringEnd())

    # Reductions
    and_exp = Forward()
    exp = course | lparen + and_exp + rparen
    or_exp = Group(exp + ZeroOrMore(or_sep + exp))
    and_exp << or_exp + ZeroOrMore(and_sep + and_exp)
    
    prereq_list = (and_exp + end) | end

    # parsing actions
    or_exp.setParseAction( if_2  )

    return prereq_list.parseString(text)


def unparse(mod_list):
    if len(mod_list) == 0:
        return ""
        
    output_list = []
    if mod_list[0] == '_or':
        or_list = []
        for val in mod_list[1:]:
            if (type(val) == list) or (type(val) == ParseResults):
                or_list.append(unparse(val))
            else:
                or_list.append(val) 
        output_list.append(" or ".join(or_list))
    else:
        for val in mod_list:
            if (type(val) == list) or (type(val) == ParseResults):
                output_list.append("(" + unparse(val)+ ")")
            else:
                output_list.append(val)
    return " & ".join(output_list)

def unparse_link(mod_list, link):
    if len(mod_list) == 0:
        return ""
        
    output_list = []
    if mod_list[0] == '_or':
        or_list = []
        for val in mod_list[1:]:
            if (type(val) == list) or (type(val) == ParseResults):
                or_list.append(unparse_link(val, link))
            else:
                or_list.append(link % (val, val))
        output_list.append(" or ".join(or_list))
    else:
        for val in mod_list:
            if (type(val) == list) or (type(val) == ParseResults):
                output_list.append("(" + unparse_link(val, link)+ ")")
            else:
                output_list.append(link % (val, val))
    return " &amp ".join(output_list)

if __name__ == '__main__':
    test2 = "CLA100A & CLA1223B & CLA321B or BSD101L & (SDF1234A or (ABC123 or ABC1236) ) & AGG101"
    print test2
    print parse_modules(test2)    
    print unparse(parse_modules(test2))

#ifndef CMD_RENDER_H
#define CMD_RENDER_H

void command_render(poppler::document* doc, std::vector<int>& pages, std::string& output_base_name, int ppi, std::string render_format, bool anti_aliased, bool text_only);

#endif
